import { getLANIP } from './lan';

const lanSubnet = process.env.LAN_SUBNET || '192.168.1.0';

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }

  const lanIP = getLANIP(lanSubnet);
  replaceText('ip', lanIP);
});
