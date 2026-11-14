# StockFlow – Inventory Management System

**A Multi-Tenant SaaS Inventory Management MVP**

StockFlow is a web-based inventory management application developed as part of a structured six-hour technical assessment. It enables users to manage products, monitor inventory quantities, track low-stock items, and configure organization-level inventory settings.

The application uses React and Vite for the frontend, Supabase for authentication and backend services, and PostgreSQL for database management.

---

## 🌐 Project Links

- **GitHub Repository:** https://github.com/Dinesh07715/stockflow-inventory-management
- **Live Application: https://stockflowinventory-management.netlify.app/login.

---

# 1. Project Objectives

The primary objective was to develop a simple, functional, multi-tenant inventory management application within a six-hour MVP development window.

The application allows users to:

- Register and log in securely.
- Create and manage their organization.
- Add, view, update, and delete products.
- Manage stock quantities and product prices.
- Monitor total inventory through a dashboard.
- Identify products that have reached low-stock levels.
- Configure default low-stock settings.
- Access only the inventory data belonging to their organization.

---

# 2. Technology Stack

| Category | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend Services | Supabase |
| Authentication | Supabase Auth |
| Database | PostgreSQL |
| Database Security | Row Level Security (RLS) |
| API Communication | Supabase JavaScript Client |
| Version Control | Git |
| Source Code Hosting | GitHub |
| Deployment | Netlify |

---

# 3. Six-Hour Development Timeline

The project was developed in six structured development phases, with each hour focusing on a specific part of the MVP.

## Hour 1 – Project Foundation and Authentication

**Objective:** Establish the application foundation and implement user authentication and organization setup.

### Work completed

- Initialized the React application using Vite.
- Configured the frontend development environment.
- Integrated Supabase with the React application.
- Configured Supabase environment variables.
- Created the initial database structure for organizations and user profiles.
- Implemented user signup and login interfaces.
- Integrated email and password authentication.
- Established the foundation for organization-based user access.

### Key outcome

Established the application foundation and authentication workflow required for a multi-tenant inventory management system.

---

## Hour 2 – Product and Inventory Management

**Objective:** Implement the core product management functionality.

### Work completed

- Designed the product management interface.
- Implemented product creation.
- Implemented product listing.
- Implemented product editing.
- Implemented product deletion.
- Integrated product operations with Supabase PostgreSQL.
- Added product information fields, including:
  - Product Name
  - SKU
  - Description
  - Quantity on Hand
  - Cost Price
  - Selling Price
  - Low Stock Threshold
- Connected product records with organization IDs.
- Implemented inventory quantity management.

### Key outcome

Users can create, view, update, and delete products while managing their inventory information.

---

## Hour 3 – Dashboard Overview

**Objective:** Develop an inventory dashboard to provide an overview of stock information.

### Work completed

- Created the dashboard interface.
- Integrated dashboard data with Supabase.
- Implemented total product count.
- Implemented total stock quantity calculation.
- Implemented low-stock product identification.
- Displayed low-stock inventory information.
- Integrated organization-specific inventory data into dashboard calculations.

### Low-stock calculation

A product is considered low stock when:

`Quantity on Hand <= Low Stock Threshold`

When a product does not have a custom threshold, the organization's default threshold is used.

### Key outcome

Users can monitor their inventory through dashboard summary information and identify products requiring stock attention.

---

## Hour 4 – Organization Settings

**Objective:** Implement basic organization-level inventory configuration.

### Work completed

- Created the settings interface.
- Implemented the default low-stock threshold field.
- Created the `organization_settings` database table.
- Integrated settings with Supabase.
- Implemented settings persistence.
- Connected the default threshold with dashboard low-stock calculations.
- Ensured products without custom thresholds use the organization's default setting.

### Key outcome

Organizations can configure their own default low-stock threshold, and the setting persists after refreshing the application.

---

## Hour 5 – MVP Quality and UI Polish

**Objective:** Improve the application's usability and overall user experience.

### Work completed

- Improved the overall application interface.
- Refined dashboard presentation.
- Improved product management screens.
- Refined forms and application navigation.
- Improved the consistency of the application layout.
- Reviewed the authentication and protected-route experience.
- Improved user-facing error and feedback messages.
- Reviewed the core MVP workflows.

### Key outcome

Improved the application's presentation, usability, and consistency to make the MVP suitable for an end-to-end demonstration.

---

## Hour 6 – Final Testing and Deployment Preparation

**Objective:** Verify the core application functionality and prepare the application for deployment.

### Work completed

- Tested user authentication.
- Tested organization creation and profile linking.
- Tested product creation, editing, and deletion.
- Verified dashboard inventory calculations.
- Tested low-stock threshold functionality.
- Verified organization settings persistence.
- Reviewed organization-level data isolation.
- Reviewed the application build.
- Prepared the GitHub repository for deployment.

### Key outcome

Completed the core MVP implementation and prepared the application for production deployment.

---

# 4. Additional Improvements After the Six-Hour MVP

Following the initial six-hour implementation, additional fixes and verification were completed to improve authentication reliability and organization provisioning.

### Authentication and organization provisioning

- Added organization setup verification during login.
- Stored the organization name in Supabase user metadata during signup.
- Handled email confirmation before organization provisioning.
- Added existing organization detection to avoid duplicate organization creation.
- Added profile lookup and creation handling.
- Added retry handling for partially completed organization setup.
- Improved authentication and organization setup error messages.

### Codespaces development configuration

- Updated Vite server configuration.
- Configured the development server for GitHub Codespaces.
- Added WebSocket HMR configuration for forwarded HTTPS development URLs.
- Enforced the configured development port.

### Key outcome

Improved the reliability of authentication and organization setup, particularly when email confirmation is enabled.

---

# 5. Database Design

StockFlow uses Supabase PostgreSQL as its database.

The application contains four primary tables.

| Table | Description |
|---|---|
| `organizations` | Stores organization information |
| `profiles` | Stores user profile and organization relationships |
| `products` | Stores product and inventory details |
| `organization_settings` | Stores organization-level inventory settings |

### Database relationships

- An organization is associated with its creator.
- A user profile is linked to an organization.
- Products belong to an organization.
- Organization settings belong to an organization.

### Database migrations

Database migrations are maintained in:

`supabase/migrations/`

Migration files:

1. `20261113114446_create_organizations_and_profiles.sql`
2. `20261113114512_tighten_grants_orgs_profiles.sql`
3. `20261113120000_create_products.sql`
4. `20261113130000_create_organization_settings.sql`
5. `20261113140000_harden_organization_membership.sql`

These migrations establish the database schema, permissions, organization relationships, and security policies.

---

# 6. Application Security and Multi-Tenant Architecture

One of the important requirements of StockFlow is organization-level data isolation.

### Security implementation

- Supabase Authentication for user identity.
- Organization-based profile relationships.
- PostgreSQL Row Level Security.
- Organization-scoped product access.
- Restricted organization and profile operations.
- Protected application routes.

### Tenant isolation testing

Tenant isolation was tested using two separate user accounts.

**Test Scenario:**

1. Created the first test organization.
2. Added a laptop product to the first organization.
3. Created a second test organization.
4. Logged in using the second user account.
5. Verified that the second organization could not see the first organization's laptop.
6. Inspected the authenticated products API response through browser Developer Tools.

**Expected and observed result:**

The second user's authenticated products query returned an empty array when requesting the first organization's laptop.

This verified that the tested cross-organization product read was blocked.

---

# 7. Functional Testing

The following application workflows were tested during development and final verification.

| Test Case | Result |
|---|---|
| User registration | Passed |
| User login | Passed |
| Organization creation | Passed |
| User and organization linking | Passed |
| Product creation | Passed |
| Product listing | Passed |
| Product editing | Passed |
| Product deletion | Passed |
| Inventory quantity management | Passed |
| Dashboard product count | Passed |
| Dashboard stock quantity | Passed |
| Low-stock calculation | Passed |
| Custom low-stock threshold | Passed |
| Default organization threshold | Passed |
| Settings persistence | Passed |
| Organization data isolation | Passed |
| Authenticated cross-tenant product read test | Passed |

---

# 8. Project Structure

The main application structure includes:

```text
stockflow-inventory-management/
│
├── public/
│
├── src/
│   ├── components/
│   │
│   ├── context/
│   │
│   ├── lib/
│   │   ├── supabaseClient.js
│   │   └── organizationSetup.js
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   └── Settings.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── supabase/
│   └── migrations/
│
├── .env.example
├── .gitignore
├── index.html
├── netlify.toml
├── package.json
├── vite.config.js
└── README.md
```

*The structure above represents the main application organization; individual supporting files may vary.*

---

# 9. Local Development Setup

### Prerequisites

- Node.js 22
- npm
- Git
- Supabase account and project

### Step 1 – Clone the repository

```bash
git clone https://github.com/Dinesh07715/stockflow-inventory-management.git
```

### Step 2 – Navigate into the project

```bash
cd stockflow-inventory-management
```

### Step 3 – Install dependencies

```bash
npm install
```

### Step 4 – Configure environment variables

Copy `.env.example` to `.env` and configure:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Never expose a Supabase service-role key in frontend code or a `VITE_` variable.

### Step 5 – Configure the database

Apply all five SQL migration files in filename order using the Supabase SQL Editor.

### Step 6 – Start the development server

```bash
npm run dev
```

The application will be available at the local Vite development URL.

---

# 10. Build and Quality Checks

Run the production build:

```bash
npm run build
```

Run the lint checks:

```bash
npm run lint
```

The production build was completed successfully during final verification.

---

# 11. Production Deployment – Netlify

StockFlow was deployed using Netlify.

### Deployment configuration

| Setting | Configuration |
|---|---|
| Source | GitHub |
| Repository | stockflow-inventory-management |
| Branch | `main` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node.js version | 22 |

### Environment variables

The following environment variables were configured in Netlify:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase authentication configuration

The deployed application uses the configured production Site URL and authentication redirect URL allowlist.

The deployed application was tested after deployment.

**Live Application:** Add your Netlify URL here.

---

# 12. Git and Version Control

The project was developed using Git and GitHub with regular commits to track development progress.

The development milestones were recorded through the following commits:

| Development milestone | Commit |
|---|---|
| Hour 2 – Product and Inventory Management | `fc00605` |
| Hour 3 – Dashboard Overview | `feb4aee` |
| Hour 4 – Settings | `046eb57` |
| Hour 5 – MVP Quality and UI Polish | `504b4ac` |
| Hour 6 – Final Testing and Deployment | `418192d` |
| Additional authentication and organization provisioning fixes | `2149602` |

**Latest commit:** `2149602`

**Commit message:** Fix authentication and organization provisioning

**Repository:** https://github.com/Dinesh07715/stockflow-inventory-management

---

# 13. MVP Scope and Exclusions

The project follows the scope-reduced six-hour MVP requirements.

### Included features

- User authentication
- Organization setup
- Product CRUD operations
- Inventory quantity management
- Dashboard summaries
- Low-stock monitoring
- Organization settings
- Organization-level data isolation

### Out-of-scope features

The following features were excluded from the six-hour MVP:

- Multi-warehouse management
- Product variants
- Channel integrations
- Order management and reservations
- Purchase orders
- Supplier management
- Email notifications
- CSV imports
- External API access
- Advanced role-based access control
- Audit logs and detailed stock movement history
- Billing and subscription management

---

# 14. Project Outcome

StockFlow was developed as a functional multi-tenant inventory management MVP within the structured six-hour development assessment.

The application provides user authentication, organization management, product CRUD operations, inventory monitoring, dashboard summaries, configurable low-stock settings, and organization-level data isolation.

The application was tested using separate organization accounts, committed to GitHub, and deployed to Netlify.

---

# 15. Author

**Dinesh Kumar Ravuri**

GitHub: https://github.com/Dinesh07715

Project: StockFlow – Inventory Management System

---

**StockFlow – Simple, Secure, and Efficient Inventory Management.**
