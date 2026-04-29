# it3030-paf-2026-smart-campus-group98 – FacilityFlow - Smart Campus Operations Hub

## Facility Flow | Smart Campus Operations Hub 

Facility Flow is a Smart Campus Operations Hub designed for a university Smart Campus ecosystem. It provides a secure, role-based infrastructure for staff(users), technicians and admins.

This repository contains components from all 4 team members.

## 👥 Team Contributions

| Member | Module / Responsibility | Endpoints / Components |
| :--- | :--- | :--- |
| Member 1 | Notifications & OAuth | `/api/notifications`, OAuth integration, role management |
| Member 2 | Incident tickets | `/api/tickets`, attachments, Technician updates |
| Member 3 | Facilities catalogue | `/api/resources` endpoints, Resource UI |
| Member 4 | Booking workflow | `/api/bookings`, conflict check, Booking UI |



---

## 🚀 Tech Stack

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.2.4 (Java 17)
- **Security**: Spring Security (OAuth2 Client + JWT)
- **Auth Strategy**: Google OAuth 2.0 with custom `prompt=select_account` integration.
- **Database**: MongoDB (NoSQL) for scalable campus records.
- **Token**: Stateless JSON Web Tokens (JWT) for secure API authorization.
- **Utilities**: Lombok, Jakarta Annotations, JJWT 0.11.5.

### Frontend (React + Vite)
- **Framework**: React 18
- **Build Tool**: Vite 5.2 (Fast HMR & Optimized Builds)
- **Navigation**: React Router 6 (with Protected Role-Based Routing)
- **Styling**: Tailwind CSS 3.4 with **Royal Blue (#4169E1)** design system.
- **Icons**: Lucide React for a crisp, modern UI.
- **State Management**: React Context API for global Authentication and User Role state.
- **API Client**: Axios with interceptors for automatic JWT attachment.
- **Token Handling**: JWT Decode for client-side role extraction.

---

## 🛠️ Prerequisites
- **Java 17+**
- **Node.js 18+**
- **MongoDB** (Local or Cloud instance)
- **Google Cloud Console Project** (for OAuth2 credentials)

---

## ⚙️ Google OAuth2 Configuration
To enable Google Login:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create an **OAuth 2.0 Client ID** (Web Application).
3. Set the **Authorized Redirect URI** to:
   `http://localhost:8092/login/oauth2/code/google`
4. Copy your **Client ID** and **Client Secret**.

---

## 🏃 How to Run

### 1. Backend Setup
1. Create your local configuration file:
   ```powershell
   cd backend/src/main/resources
   cp application.yml.example application.yml
   ```
2. Open **`application.yml`** and fill in your real credentials:
   - **MongoDB URI**: Your connection string (Local or MongoDB Atlas).
   - **Google OAuth**: Your Client ID and Secret (from Google Cloud Console).
   - **JWT Secret**: A random secure string (e.g., generated via `openssl rand -hex 32`).
   - **Cloudinary**: Your Cloudinary credentials for image storage.

> [!IMPORTANT]
> **Security First**: The `application.yml` file is already added to `.gitignore`. Your real secrets will **never** be committed to your repository. Only `application.yml.example` is shared.

3. Run the backend:
   ```powershell
   cd backend
   mvn spring-boot:run
   ```
   *Server starts on port **8092**.*

### 2. Frontend Setup
1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Create your environment file:
   ```powershell
   cd frontend
   cp .env.example .env
   ```
3. Open **`.env`** and configure:
   - `VITE_API_BASE_URL`: Set to `http://localhost:8092/api` for local development.
   - `VITE_AUTH_BASE_URL`: Set to `http://localhost:8092`.
4. Start the application:
   ```powershell
   npm start
   ```
   *Dashboard launches on port **3000**.*

---

## 💡 Role-Based Features
- **USER**: Access to personal **Dashboard**, **Facility Bookings**, and **Maintenance Tickets**.
- **TECHNICIAN**: Access to the **Technician Console**, **Pending Tasks**, and **Maintenance Work**.
- **ADMIN**: Full access to **User Management**, **Role Assignments**, and **Security Logs**.

*Facility-Flow - Project developed for University Smart Campus Operations Hub.*
