# VoteQ

A voting report application built with Fastify, MongoDB, and Mithril.js.

---

## Features

- **Fast & Modern Backend**: Built with [Fastify](https://www.fastify.io/), a high-performance Node.js web framework.
- **User Authentication**: Secure user login and session management using JSON Web Tokens (`@fastify/jwt`) and password hashing (`bcryptjs`).
- **Database Integration**: Uses Mongoose for elegant MongoDB object modeling and interaction.
- **Static Frontend**: Serves a lightweight frontend built with Mithril.js.
- **Data Export**: Ability to export voting data to CSV format using `json2csv`.
- **Image Processing**: Utilizes `sharp` for efficient image handling, likely for candidate photos or user avatars.
- **Environment Configuration**: Manages environment variables securely with `dotenv`.

## Technology Stack

- **Backend**: Node.js, Fastify
- **Frontend**: Mithril.js
- **Database**: MongoDB
- **Key Libraries**:
  - `mongoose`: Object Data Modeling (ODM) for MongoDB
  - `@fastify/jwt`: JWT Authentication
  - `@fastify/static`: Serving static files
  - `bcryptjs`: Password Hashing
  - `json2csv`: Report generation
  - `sharp`: Image processing

## Getting Started

### Prerequisites

- Node.js (version >=18.0.0)
- MongoDB
- Git

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd VoteQ
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the necessary variables (e.g., `MONGO_URI`, `JWT_SECRET`).

4.  **Run the application:**
    For development with auto-reloading:
    ```sh
    npm run dev
    ```
    To start in production mode:
    ```sh
    npm start
    ```

## Deployment to Render

This project is configured for easy deployment to [Render](https://render.com/).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### How It Works

This repository contains a `render.yaml` file that uses "Infrastructure as Code" to tell Render how to set up the service.

1.  Click the "Deploy to Render" button above or create a **New Blueprint Instance** from the Render dashboard.
2.  Connect your GitHub repository.
3.  Render will automatically detect and use the `render.yaml` file.
4.  In the environment variables section, you **must** add a value for `MONGO_URI`. Your `JWT_SECRET` will be generated for you automatically.
5.  Click **Apply** and wait for the deployment to complete.

Your application will be live! Render will also automatically redeploy your application whenever you push new changes to your main branch.

---

<br>

---

<br>

---

# VoteQ (Bahasa Indonesia)

Aplikasi laporan pemungutan suara yang dibangun dengan Fastify, MongoDB, dan Mithril.js.

---

## Fitur

- **Backend Cepat & Modern**: Dibangun dengan Fastify, sebuah web framework Node.js berperforma tinggi.
- **Otentikasi Pengguna**: Login pengguna dan manajemen sesi yang aman menggunakan JSON Web Tokens (`@fastify/jwt`) dan hashing kata sandi (`bcryptjs`).
- **Integrasi Database**: Menggunakan Mongoose untuk pemodelan objek dan interaksi MongoDB yang elegan.
- **Frontend Statis**: Menyajikan frontend ringan yang dibangun dengan Mithril.js.
- **Ekspor Data**: Kemampuan untuk mengekspor data pemungutan suara ke format CSV menggunakan `json2csv`.
- **Pemrosesan Gambar**: Memanfaatkan `sharp` untuk penanganan gambar yang efisien, kemungkinan untuk foto kandidat atau avatar pengguna.
- **Konfigurasi Lingkungan**: Mengelola variabel lingkungan secara aman dengan `dotenv`.

## Tumpukan Teknologi

- **Backend**: Node.js, Fastify
- **Frontend**: Mithril.js
- **Database**: MongoDB
- **Pustaka Utama**:
  - `mongoose`: Object Data Modeling (ODM) untuk MongoDB
  - `@fastify/jwt`: Otentikasi JWT
  - `@fastify/static`: Menyajikan file statis
  - `bcryptjs`: Hashing Kata Sandi
  - `json2csv`: Pembuatan laporan
  - `sharp`: Pemrosesan gambar

## Memulai

### Prasyarat

- Node.js (versi >=18.0.0)
- MongoDB
- Git

### Instalasi & Pengaturan

1.  **Clone repositori:**
    ```sh
    git clone <url-repositori-anda>
    cd VoteQ
    ```

2.  **Instal dependensi:**
    ```sh
    npm install
    ```

3.  **Atur variabel lingkungan:**
    Buat file `.env` di direktori root dan tambahkan variabel yang diperlukan (misalnya, `MONGO_URI`, `JWT_SECRET`).

4.  **Jalankan aplikasi:**
    Untuk pengembangan dengan auto-reloading:
    ```sh
    npm run dev
    ```
    Untuk memulai dalam mode produksi:
    ```sh
    npm start
    ```

## Deployment ke Render

Proyek ini telah dikonfigurasi untuk kemudahan deployment ke Render.

[!Deploy to Render](https://render.com/deploy)

### Cara Kerja

Repositori ini berisi file `render.yaml` yang menggunakan "Infrastructure as Code" untuk memberitahu Render cara menyiapkan layanan.

1.  Klik tombol "Deploy to Render" di atas atau buat **New Blueprint Instance** dari dasbor Render.
2.  Hubungkan repositori GitHub Anda.
3.  Render akan secara otomatis mendeteksi dan menggunakan file `render.yaml`.
4.  Di bagian variabel lingkungan (environment variables), Anda **harus** menambahkan nilai untuk `MONGO_URI`. `JWT_SECRET` Anda akan dibuat secara otomatis.
5.  Klik **Apply** dan tunggu hingga proses deployment selesai.

Aplikasi Anda akan online! Render juga akan secara otomatis melakukan deploy ulang setiap kali Anda mengirim perubahan baru ke branch utama Anda.