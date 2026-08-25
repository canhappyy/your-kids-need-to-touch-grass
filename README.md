# your-kids-need-to-touch-grass

The project uses:

- **Next.js** for the web application
- **Tailwind CSS** for styling and responsive design
- **shadcn/ui** for reusable UI components
- **PostgreSQL** as the relational database
- **Docker** for running PostgreSQL locally
- **Neon PostgreSQL** for the deployed database

During development, team members should use the local PostgreSQL database first. The application can later connect to **Neon** by changing the database connection string

---

## Project Structure

```text
project-root/
├── apps/
│   └── web/                  # Next.js application
│
├── database/
│   ├── schema.sql            # Database table definitions
│   └── seed.sql              # Sample data for local development
│
├── docker-compose.yml        # Local PostgreSQL configuration
├── .gitignore
└── README.md
```

---

## Perequisites

- Node.js / npm
- Docker Desktop
- [Optional] Database client (e.g. DBeaver, DataGrip) for inspecting the local database

---

## 1. Install Frontend Dependencies

```command
cd apps/web
npm install
cd ../..
```

## 2. Start the Local Database

From the project root, run:

```command
docker compose up -d
```

> **Note:** `-d` is **detached mode** runs the database container in the background

When the PostgreSQL container is created for the first time, Docker automatically runs:

```text
database/schema.sql
database/seed.sql
```

### Resetting the Local Database

If `schema.sql` or `seed.sql` changes and you want to completely rebuild your local database, run:

```command
docker compose down -v
docker compose up -d
```

> **Warning:** `docker compose down -v` deletes all data stored in the local PostgreSQL Docker volume.

If you only want to stop the database without deleting the data:

```command
docker compose down
```

---

## 3. Configure Environment Variables

Create a local environment file inside:

```text
apps/web/.env.local
```

Add:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb
```

Do not commit `.env.local` to Git

---

## 4. Run the Next.js Application

Move into the web application and start the development server:

```command
cd apps/web
npm run dev
```
