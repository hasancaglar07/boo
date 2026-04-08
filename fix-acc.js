const fs = require('fs');
const path = 'C:\\Users\\ihsan\\Desktop\\BOOK\\web\\src\\components\\app\\account-screen.tsx';

// Helper: hex string -> UTF-8 string
function h(hex) {
  return Buffer.from(hex, 'hex').toString('utf8');
}

let c = fs.readFileSync(path, 'utf8');

// Replacements: [turkishHex, english]
const R = [
  ['4e652079617a6d616b20697374656469c491696e69207461726966206574', 'Describe what you want to write'],
  ['c49c6c6b206b69746162c4b16ec4b1206f6cc59f747572', 'Create your first book'],
  ['57697a61726420696c6520696c6b206b69746162c4b16ec4b12079617a', 'Write your first book with the wizard'],
  ['42c3a7c59f6c61', 'Get Started'],
  ['414920696c65206b69746170206b617061c49fc4b1206f6cc59f747572', 'Generate book cover with AI'],
  ['504446202f20455055422064c4b1c59fa20616b746172', 'Export PDF / EPUB'],
  ['c59fa20616b746172c4b16dc4b12079617a64c4b16ec4b1', 'exports completed'],
  ['4b69746162c4b16ec4b120696e646972696c6562697220666f726d61746120c3a765766972', 'Convert your book to downloadable format'],
  ['5072656d69756d2761206765c3a7', 'Upgrade to Premium'],
  ['706c616ec4b16ec4b06461736ec4b1', 'on the {plan} plan'],
  ['54616d20657269c59f696d20696cc3a7696e20706c616ec4b16ec4b12079c3bcc6b37c656c74', 'Upgrade your plan for full access'],
  ['506c616e6c6172c4b12047c3b672', 'View Plans'],
  ['50726f66696c696e20253130302074616d616d6c616ec4b16ec4b121', 'Your profile is 100% complete!'],
  ['53c4b1c5726164616b69206164c4b16ec4b06d6c6172', 'Next steps'],
  ['42c3a7c4b16ec4b0206c616e7461c4b120736f72756e75206f6cc59f74c3bc2e', 'Connection issue occurred.'],
  ['50726f66696c207665206b756c6c616ec4b16ec4b06d20c3b67a6574692e', 'Profile and usage summary.'],
  ['c387c4b16bc4b06920796170', 'Sign Out'],
  ['48656ec3bc7a206b6974617020796f6b2e', 'No books yet.'],
  ['48656ec3bc7a2064c4b1c59fa20616b746172c4b16dc4b120796f6b2e', 'No exports yet.'],
  ['504446206f6cc59f747572', 'Create PDF'],
  ['546f706c616d20c3a7c4b16bc4b074c4b1', 'Total output'],
  ['416464206e616d656e6e656d69', 'Add name'],
  ['53657420676f616c6e6e656d69', 'Set goal'],
  ['486566656420656b6c65', 'Add goal'],
  ['74616d616d6c616ec4b16ec4b1', 'completed'],
  ['50726f66696c2074616d616d6c616d617961206261c59f6c616d616b20696cc3a7696e2061c59f61c4b16ec4b064616b69206164c4b16ec4b06d6c6172c4b12074616b69702065742e', 'Follow the steps below to start completing your profile.'],
  ['c49c796920676964696f7273756e7521', 'Great progress!'],
  ['6164c4b16dc4206b616c64c4b12e', 'steps remaining.'],
  ['6164c4b16dc4b12074616d616d6c612e', 'steps to complete.'],
  ['4b6170616b2074617361726c61', 'Design cover'],
  ['4b697461702059617a', 'Write Book'],
  ['4b61706174', 'Close'],
  ['546f706c616d206b69746170', 'Total books'],
  ['50726f66696c2074616d616d6c616e6d61', 'Profile completion'],
  ['50726f66696c2054616d616d6c616d61', 'Profile Completion'],
  ['4b6cc3bc74c3bc7068616e65796520476974', 'Go to Library'],
];

// Sort by length descending so longer matches first
R.sort((a, b) => b[0].length - a[0].length);

let count = 0;
for (const [hex, en] of R) {
  const tr = h(hex);
  if (c.includes(tr)) {
    c = c.replaceAll(tr, en);
    count++;
    console.log('Replaced:', en);
  }
}

// Context-sensitive label replacements
const labels = {
  '<div className="text-sm text-muted-foreground">Ad</div>': '<div className="text-sm text-muted-foreground">Name</div>',
  '<div className="text-sm text-muted-foreground">E-posta</div>': '<div className="text-sm text-muted-foreground">Email</div>',
  '<div className="text-sm text-muted-foreground">Hedef</div>': '<div className="text-sm text-muted-foreground">Goal</div>',
  'title="Hesap"': 'title="Account"',
  'actionLabel="Ekle"': 'actionLabel="Add"',
};

for (const [tr, en] of Object.entries(labels)) {
  if (c.includes(tr)) {
    c = c.replaceAll(tr, en);
    count++;
    console.log('Replaced label:', en);
  }
}

fs.writeFileSync(path, c, 'utf8');
console.log(`\nTotal replacements: ${count}`);

// Verify: check for Turkish chars
const remaining = c.match(/[\u00e7\u011f\u0131\u00f6\u015f\u00fc\u00c7\u011e\u0130\u00d6\u015e\u00dc\u00e2\u00ee\u00fb\u00c2\u00ce\u00db]/g);
if (remaining) {
  console.log(`WARNING: ${remaining.length} Turkish characters still remain`);
} else {
  console.log('SUCCESS: 0 Turkish characters remaining.');
}
