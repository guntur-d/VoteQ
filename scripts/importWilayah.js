// Script to import wilayah_data JSON files into MongoDB
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();


const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}


// Provinsi schema
const provinsiSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});
const Provinsi = mongoose.model('Provinsi', provinsiSchema);

// Kabupaten/Kota schema
const kabupatenKotaSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  provinsiCode: { type: String, required: true },
  provinsiName: { type: String }
});
const KabupatenKota = mongoose.model('KabupatenKota', kabupatenKotaSchema);

// Kecamatan schema
const kecamatanSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  provinsiCode: { type: String, required: true },
  kabupatenCode: { type: String, required: true },
  kabupatenName: { type: String },
  provinsiName: { type: String }
});
const Kecamatan = mongoose.model('Kecamatan', kecamatanSchema);

// Kelurahan/Desa schema
const kelurahanDesaSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  provinsiCode: { type: String, required: true },
  kabupatenCode: { type: String, required: true },
  kecamatanCode: { type: String, required: true },
  kabupatenName: { type: String },
  kecamatanName: { type: String },
  provinsiName: { type: String }
});
const KelurahanDesa = mongoose.model('KelurahanDesa', kelurahanDesaSchema);


async function importProvinsi(dir) {
  const filePath = path.join(dir, 'provinsi.json');
  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const docs = Object.entries(data).map(([code, name]) => ({ code, name }));
  await Provinsi.deleteMany({});
  await Provinsi.insertMany(docs);
  console.log(`Inserted ${docs.length} provinsi`);
}

async function importKabupatenKota(dir) {
  const files = await fs.readdir(dir);
  let total = 0;
  for (const file of files) {
    if (file.endsWith('.json')) {
      // filename: kab-XX.json
      const provinsiCode = file.match(/^kab-(\d+)\.json$/)?.[1];
      if (!provinsiCode) continue;
      const provinsi = await Provinsi.findOne({ code: provinsiCode });
      const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
      const docs = Object.entries(data).map(([code, name]) => ({
        code,
        name,
        provinsiCode,
        provinsiName: provinsi ? provinsi.name : undefined
      }));
      await KabupatenKota.insertMany(docs);
      total += docs.length;
    }
  }
  console.log(`Inserted ${total} kabupaten/kota`);
}

async function importKecamatan(dir) {
  const files = await fs.readdir(dir);
  let total = 0;
  for (const file of files) {
    if (file.endsWith('.json')) {
      // filename: kec-XX-YY.json
      const m = file.match(/^kec-(\d+)-(\d+)\.json$/);
      if (!m) continue;
      const [_, provinsiCode, kabupatenCode] = m;
      const provinsi = await Provinsi.findOne({ code: provinsiCode });
      const kabupaten = await KabupatenKota.findOne({ code: kabupatenCode, provinsiCode });
      const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
      const docs = Object.entries(data).map(([code, name]) => ({
        code,
        name,
        provinsiCode,
        kabupatenCode,
        kabupatenName: kabupaten ? kabupaten.name : undefined,
        provinsiName: provinsi ? provinsi.name : undefined
      }));
      await Kecamatan.insertMany(docs);
      total += docs.length;
    }
  }
  console.log(`Inserted ${total} kecamatan`);
}

async function importKelurahanDesa(dir) {
  const files = await fs.readdir(dir);
  let total = 0;
  for (const file of files) {
    if (file.endsWith('.json')) {
      // filename: keldesa-XX-YY-ZZZ.json
      const m = file.match(/^keldesa-(\d+)-(\d+)-(\d+)\.json$/);
      if (!m) continue;
      const [_, provinsiCode, kabupatenCode, kecamatanCode] = m;
      const provinsi = await Provinsi.findOne({ code: provinsiCode });
      const kabupaten = await KabupatenKota.findOne({ code: kabupatenCode, provinsiCode });
      const kecamatan = await Kecamatan.findOne({ code: kecamatanCode, kabupatenCode, provinsiCode });
      const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
      const docs = Object.entries(data).map(([code, name]) => ({
        code,
        name,
        provinsiCode,
        kabupatenCode,
        kecamatanCode,
        kabupatenName: kabupaten ? kabupaten.name : undefined,
        kecamatanName: kecamatan ? kecamatan.name : undefined,
        provinsiName: provinsi ? provinsi.name : undefined
      }));
      await KelurahanDesa.insertMany(docs);
      total += docs.length;
    }
  }
  console.log(`Inserted ${total} kelurahan/desa`);
}


async function main() {
  await mongoose.connect(MONGO_URI, DB_NAME ? { dbName: DB_NAME } : undefined);
  const base = path.resolve('wilayah_data');
  // Clean all collections
  await Promise.all([
    Provinsi.deleteMany({}),
    KabupatenKota.deleteMany({}),
    Kecamatan.deleteMany({}),
    KelurahanDesa.deleteMany({})
  ]);
  await importProvinsi(path.join(base, 'provinsi'));
  await importKabupatenKota(path.join(base, 'kabupaten_kota'));
  await importKecamatan(path.join(base, 'kecamatan'));
  await importKelurahanDesa(path.join(base, 'kelurahan_desa'));
  await mongoose.disconnect();
  console.log('Import finished.');
}

main();
