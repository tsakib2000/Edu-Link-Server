# EduLink - Server

## Overview
This is the server-side implementation of the Collaborative Study Platform. It includes robust API endpoints for managing users, study sessions, and resources.

## Features
- JWT-based authentication and authorization.
- Role-based access control for secure endpoints.
- MongoDB integration for efficient data management.
- API endpoints for CRUD operations on users, sessions, and resources.
- Pagination implementation for large datasets.
- Search functionality for user management.



## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Programming-Hero-Web-Course4/b10a12-server-side-tsakib2000.git
   ```
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with the following variables:
   - `DB_USER`
   - `DB_PASS`
   - `STRIPE_SECRET_KEY`
   - `ACCESS_TOKEN_SECRET`
  
5. Start the development server:
   ```bash
   npm start
   ```

## Server URL

https://edulink-woad-eight.vercel.app/