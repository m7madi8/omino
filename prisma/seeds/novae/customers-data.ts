export type NovaeCustomerDef = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  tags?: string[];
  notes?: string;
};

export const NOVAE_CUSTOMERS: NovaeCustomerDef[] = [
  { firstName: 'Lina', lastName: 'Khalil', email: 'lina.khalil@novae.demo.omino.test', phone: '+970599100001', status: 'ACTIVE', tags: ['vip'] },
  { firstName: 'Omar', lastName: 'Nasser', email: 'omar.nasser@novae.demo.omino.test', phone: '+970599100002', status: 'ACTIVE', tags: ['returning'] },
  { firstName: 'Dana', lastName: 'Saleh', email: 'dana.saleh@novae.demo.omino.test', phone: '+970599100003', status: 'ACTIVE' },
  { firstName: 'Adam', lastName: 'Haddad', email: 'adam.haddad@novae.demo.omino.test', phone: '+970599100004', status: 'ACTIVE', tags: ['vip', 'returning'] },
  { firstName: 'Noor', lastName: 'Sami', email: 'noor.sami@novae.demo.omino.test', phone: '+970599100005', status: 'ACTIVE' },
  { firstName: 'Rami', lastName: 'Darwish', email: 'rami.darwish@novae.demo.omino.test', phone: '+970599100006', status: 'ACTIVE', tags: ['returning'] },
  { firstName: 'Maya', lastName: 'Qasem', email: 'maya.qasem@novae.demo.omino.test', phone: '+970599100007', status: 'ACTIVE' },
  { firstName: 'Yara', lastName: 'Masri', email: 'yara.masri@novae.demo.omino.test', phone: '+970599100008', status: 'ACTIVE' },
  { firstName: 'Khaled', lastName: 'Awad', email: 'khaled.awad@novae.demo.omino.test', phone: '+970599100009', status: 'ACTIVE' },
  { firstName: 'Sara', lastName: 'Bitar', email: 'sara.bitar@novae.demo.omino.test', phone: '+970599100010', status: 'ACTIVE', tags: ['new'] },
  { firstName: 'Hani', lastName: 'Rajabi', email: 'hani.rajabi@novae.demo.omino.test', phone: '+970599100011', status: 'ACTIVE' },
  { firstName: 'Rana', lastName: 'Sabbah', email: 'rana.sabbah@novae.demo.omino.test', phone: '+970599100012', status: 'ACTIVE' },
  { firstName: 'Tareq', lastName: 'Hamdan', email: 'tareq.hamdan@novae.demo.omino.test', phone: '+970599100013', status: 'ACTIVE', tags: ['returning'] },
  { firstName: 'Leila', lastName: 'Fares', email: 'leila.fares@novae.demo.omino.test', phone: '+970599100014', status: 'ACTIVE' },
  { firstName: 'Ziad', lastName: 'Najjar', email: 'ziad.najjar@novae.demo.omino.test', phone: '+970599100015', status: 'ACTIVE' },
  { firstName: 'Hala', lastName: 'Mansour', email: 'hala.mansour@novae.demo.omino.test', phone: '+970599100016', status: 'ACTIVE', tags: ['vip'] },
  { firstName: 'Fadi', lastName: 'Khoury', email: 'fadi.khoury@novae.demo.omino.test', phone: '+970599100017', status: 'ACTIVE' },
  { firstName: 'Nadia', lastName: 'Zeidan', email: 'nadia.zeidan@novae.demo.omino.test', phone: '+970599100018', status: 'INACTIVE' },
  { firstName: 'Bashar', lastName: 'Odeh', email: 'bashar.odeh@novae.demo.omino.test', phone: '+970599100019', status: 'ACTIVE' },
  { firstName: 'Iman', lastName: 'Shalabi', email: 'iman.shalabi@novae.demo.omino.test', phone: '+970599100020', status: 'ACTIVE' },
  { firstName: 'Karim', lastName: 'Said', email: 'karim.said@novae.demo.omino.test', phone: '+970599100021', status: 'ACTIVE', tags: ['returning'] },
  { firstName: 'Salma', lastName: 'Barakat', email: 'salma.barakat@novae.demo.omino.test', phone: '+970599100022', status: 'ACTIVE' },
  { firstName: 'Walid', lastName: 'Tamimi', email: 'walid.tamimi@novae.demo.omino.test', phone: '+970599100023', status: 'ACTIVE' },
  { firstName: 'Aya', lastName: 'Hijazi', email: 'aya.hijazi@novae.demo.omino.test', phone: '+970599100024', status: 'ACTIVE', tags: ['new'] },
  { firstName: 'Jamil', lastName: 'Rishmawi', email: 'jamil.rishmawi@novae.demo.omino.test', phone: '+970599100025', status: 'ACTIVE' },
  { firstName: 'Ruba', lastName: 'Kanaan', email: 'ruba.kanaan@novae.demo.omino.test', phone: '+970599100026', status: 'ACTIVE' },
  { firstName: 'Elias', lastName: 'Anton', email: 'elias.anton@novae.demo.omino.test', phone: '+970599100027', status: 'ACTIVE' },
  { firstName: 'Mira', lastName: 'Hanna', email: 'mira.hanna@novae.demo.omino.test', phone: '+970599100028', status: 'ACTIVE', tags: ['vip'] },
  { firstName: 'Samir', lastName: 'Ghannam', email: 'samir.ghannam@novae.demo.omino.test', phone: '+970599100029', status: 'ACTIVE' },
  { firstName: 'Dina', lastName: 'Quraan', email: 'dina.quraan@novae.demo.omino.test', phone: '+970599100030', status: 'INACTIVE' },
  { firstName: 'Nabil', lastName: 'Sweis', email: 'nabil.sweis@novae.demo.omino.test', phone: '+970599100031', status: 'ACTIVE' },
  { firstName: 'Layla', lastName: 'Abu-Ghosh', email: 'layla.abughosh@novae.demo.omino.test', phone: '+970599100032', status: 'ACTIVE', tags: ['returning'] },
  { firstName: 'George', lastName: 'Khoury', email: 'george.khoury@novae.demo.omino.test', phone: '+970599100033', status: 'ACTIVE' },
  { firstName: 'Fatima', lastName: 'Jaber', email: 'fatima.jaber@novae.demo.omino.test', phone: '+970599100034', status: 'ACTIVE' },
  { firstName: 'Issa', lastName: 'Matar', email: 'issa.matar@novae.demo.omino.test', phone: '+970599100035', status: 'ACTIVE' },
  { firstName: 'Christine', lastName: 'Saba', email: 'christine.saba@novae.demo.omino.test', phone: '+970599100036', status: 'ACTIVE', tags: ['new'] },
  { firstName: 'Ahmad', lastName: 'Shomaly', email: 'ahmad.shomaly@novae.demo.omino.test', phone: '+970599100037', status: 'ACTIVE' },
  { firstName: 'Roula', lastName: 'Daher', email: 'roula.daher@novae.demo.omino.test', phone: '+970599100038', status: 'ACTIVE' },
  { firstName: 'Peter', lastName: 'Nassar', email: 'peter.nassar@novae.demo.omino.test', phone: '+970599100039', status: 'ACTIVE', tags: ['vip', 'returning'] },
  { firstName: 'Hind', lastName: 'Alami', email: 'hind.alami@novae.demo.omino.test', phone: '+970599100040', status: 'ACTIVE' },
];

export const PS_CITIES = [
  { city: 'Ramallah', address: 'شارع الإرسال، بناية 12، الطابق 3' },
  { city: 'Nablus', address: 'حي رفيديا، شارع الجامعة' },
  { city: 'Hebron', address: 'شارع عين سارة، مقابل السوق' },
  { city: 'Bethlehem', address: 'شارع المهد، حارة السقا' },
  { city: 'Jerusalem', address: 'شارع صلاح الدين، باب العامود' },
  { city: 'Tulkarm', address: 'شارع نابلس، مجمع النخيل' },
  { city: 'Jenin', address: 'حي الجامعة، شارع 15' },
  { city: 'Qalqilya', address: 'شارع الرئيس، بجانب البلدية' },
] as const;
