/* =========================================================
   CONNECTION – paste your Apps Script Web App URL here
   (Apps Script → Deploy → Manage deployments → Web app URL, ends in /exec)
   ========================================================= */
const API_URL = 'https://script.google.com/macros/s/AKfycbx-LuPtO3zWEGcSyTE-SmlT9FwZu9icPJIH3jowddC3ocKc1ssaSX9J-EK8dl3I3-5K/exec';

/* Image files in the /assets folder */
const ASSET = f => new URL('assets/' + f, document.baseURI).href;
const LOGO = ASSET('logo.png'), MARK = ASSET('mark.png'), SIGN = ASSET('sign.png');           // printed documents
const LOGO_UI = ASSET('logo-tight.png'), LOGO_UI_WHITE = ASSET('logo-white-tight.png');       // portal screens (cropped to the artwork so it aligns)

/* =========================================================
   NanoFly InfoTech – company details & document defaults
   Source: www.nanoflyinfotech.com (Contact & About pages)
   Anything here can be overridden from ⚙️ Settings in the portal.
   ========================================================= */
const COMPANY = {
  CompanyName: 'NanoFly InfoTech',
  Tagline: 'Digital Marketing & Educational Solutions',
  Address: '1/272A Sri Ganapathy Nagar, Marutham Veethi, Thiruppalai, Madurai-625014, Tamil Nadu',
  City: 'Madurai',
  Phone: '+91 9487772786',
  Phone2: '+91 93442 29558',
  Email: 'nanofly.works@gmail.com',
  Website: 'www.nanoflyinfotech.com',
  Hours: 'Online — Monday to Saturday',
  MDName: 'Musthaq Ahamed R',
  Instagram: 'https://www.instagram.com/nanoflyinfotech/',
  Facebook: 'https://www.facebook.com/nanoflyinfotech/',
  LinkedIn: 'https://www.linkedin.com/company/nano-fly-works/',
  Threads: 'https://www.threads.com/nanoflyinfotech/'
};
const DEF = {
  ...COMPANY,
  Tagline1: 'WHEN YOU SMILE, WE SHINE.', Tagline2: 'LET’S REACH NEW HEIGHTS. FLY WITH NANOFLY',
  ThankTitle: 'Thank you for your purchase!', ThankText: 'Great decisions build great future with', ReceiptThank: 'Thank you for your purchase!',
  SignLabel: 'Managing Director', Signature: '', ShowMDName: 'No',
  AccName: 'Musthaq Ahamed', BankName: 'Canara Bank', AccNo: '110108083366', IFSC: 'CNRB0000946', GPay: '9487772786',
  InvPrefix: 'NF-Inv', QuoPrefix: 'NF-Quo', RecPrefix: 'NF-Rec',
  OrderText: 'Order Now', OrderLink: 'https://wa.me/919487772786', QuoteNote: ''
};
const SET_FIELDS = [
  ['Company (the address is kept for your records – it is not printed)', ['CompanyName', 'Tagline', 'Address', 'City', 'Phone', 'Phone2', 'Email', 'Website', 'Hours', 'MDName']],
  ['Social links', ['Instagram', 'Facebook', 'LinkedIn', 'Threads']],
  ['Bank / payment details (on quotations)', ['AccName', 'BankName', 'AccNo', 'IFSC', 'GPay']],
  ['Document text', ['Tagline1', 'Tagline2', 'ThankTitle', 'ThankText', 'ReceiptThank', 'SignLabel', 'ShowMDName', 'OrderText', 'OrderLink', 'QuoteNote']],
  ['Numbering (PREFIX-YEAR-NN · restarts every January)', ['InvPrefix', 'QuoPrefix', 'RecPrefix']]];
const SLABEL = {
  CompanyName: 'Company name', Tagline: 'Company tagline', Phone2: 'Second phone', Hours: 'Working hours', MDName: 'Managing Director name',
  AccName: 'Account name', BankName: 'Bank name', AccNo: 'Account no', IFSC: 'IFSC code', GPay: 'GPay no', Tagline1: 'Document tagline line 1', Tagline2: 'Document tagline line 2',
  ThankTitle: 'Invoice thank-you heading', ThankText: 'Invoice thank-you line', ReceiptThank: 'Receipt thank-you heading', SignLabel: 'Signature title',
  ShowMDName: 'Print MD name under signature (Yes/No)',
  OrderText: 'Quotation button text', OrderLink: 'Quotation button link', QuoteNote: 'Quotation footnote (optional)', InvPrefix: 'Invoice prefix', QuoPrefix: 'Quotation prefix', RecPrefix: 'Receipt prefix'
};
const ST = () => Object.assign({}, DEF, Object.fromEntries(Object.entries((typeof D !== 'undefined' && D.Settings) || {}).filter(([k, v]) => v !== '')));
