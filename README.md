# FishingBooker — crew_member_photos API Tests (Cypress + TypeScript)
Sasa Platisa

Automated API tests for the `/crew_member_photos` endpoint covering GET, POST, PATCH, and DELETE.

---

## Setup

### 1. Install dependencies

```bash
npm install
npm install cypress
cypress open
```
### 2. Generate test fixture images

```bash
npm run generate:fixtures
```
This creates `photo_valid.jpg` (~100KB) and `photo_too_large.jpg` (~9MB) in `cypress/fixtures/`. -----> ne prolazi za sada 

### 3. Run tests

```bash
# Run all crew_member_photos tests headlessly
npm test

# Open Cypress Test Runner (interactive)
npm run cy:open

# Run only the crew_member_photos suite
npm run cy:run:crew
```


## Environment


| Base URL | `https://qahiring.dev.fishingbooker.com/api/v1_3` |
| Basic Auth | fishingbooker / QAFBTest |
| Token | NsDpMMpgUB1N7V4R0qcT |

