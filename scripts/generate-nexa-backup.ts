import * as fs from 'fs';
import * as path from 'path';

const raw = fs.readFileSync(path.resolve('firestore-export-old.json'), 'utf-8');
const data = JSON.parse(raw);

const nexaBackup = {
  _metadata: {
    timestamp: new Date().toISOString(),
    type: "NEXA_FULL_BACKUP",
    source: "gen-lang-client-0447500373",
    destination: "skilliq-1337"
  },
  courses: data.courses || [],
  learningPaths: data.learningPaths || [],
  notifications: data.notifications || [],
  banners: data.banners || [],
  publicProfiles: data.publicProfiles || []
};

fs.writeFileSync(path.resolve('nexa-full-backup.json'), JSON.stringify(nexaBackup, null, 2));
console.log(`Generated nexa-full-backup.json with ${nexaBackup.courses.length} courses and ${nexaBackup.learningPaths.length} paths.`);
