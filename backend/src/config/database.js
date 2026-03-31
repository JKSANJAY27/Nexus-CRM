const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '../../nexus_crm.sqlite'),
      driver: sqlite3.Database
    });
  }
  return dbPromise;
};

// Enable foreign keys for SQLite
const enableForeignKeys = async (db) => {
  await db.exec('PRAGMA foreign_keys = ON;');
};

const pool = {
  connect: async () => {
    const db = await getDb();
    await enableForeignKeys(db);
    return {
      query: async (sql, params = []) => {
        try {
          if (sql.trim().toUpperCase().startsWith('BEGIN') || 
              sql.trim().toUpperCase().startsWith('COMMIT') || 
              sql.trim().toUpperCase().startsWith('ROLLBACK')) {
            await db.run(sql);
            return { rows: [] };
          }
          const rows = await db.all(sql, params);
          return { rows: rows || [] };
        } catch (err) {
          throw err;
        }
      },
      release: () => {},
    };
  },
  query: async (sql, params = []) => {
    const db = await getDb();
    await enableForeignKeys(db);
    const rows = await db.all(sql, params);
    return { rows: rows || [] };
  },
  end: async () => {
    const db = await getDb();
    await db.close();
  }
};

module.exports = pool;
