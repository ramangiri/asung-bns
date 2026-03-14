
Same-design DB-connected version

This keeps your HTML/CSS and PDF design, but adds:
- Node.js server
- SQLite database
- employee save/read/update/delete in database
- payslip save/read/delete in database
- settings save/read in database

How to run:
1. Extract ZIP
2. Open folder in VS Code
3. Run:
   npm install
   npm start
4. Open:
   http://localhost:3000

Notes:
- database.sqlite is created automatically
- Frontend pages keep the same design
- Data now saves in database instead of only browser localStorage
