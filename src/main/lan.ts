import { NetworkInterfaceInfoIPv4, networkInterfaces } from 'os';

function belongsToSubnet(ip: string, mask: string, subnet: string): boolean {
  const ipBytes = ip.split('.').map((octet) => parseInt(octet, 10));
  const subnetBytes = subnet.split('.').map((octet) => parseInt(octet, 10));
  const maskBytes = mask.split('.').map((octet) => parseInt(octet, 10));

  return ipBytes.every((ipByte, i) => {
    // eslint-disable-next-line no-bitwise
    return (ipByte & maskBytes[i]) === subnetBytes[i];
  });
}

export function getFirstIPv4LanIp(subnet = '192.168.1.0'): string {
  const interfaces = getIPv4Interfaces();

  const lanInterface = interfaces.find((int) => {
    const ip = int.address;
    const { netmask } = int;

    return belongsToSubnet(ip, netmask, subnet);
  });

  if (!lanInterface) {
    throw new Error('No LAN interface found');
  }

  return lanInterface.address;
}

function getIPv4Interfaces(): NetworkInterfaceInfoIPv4[] {
  const interfaces = networkInterfaces();
  const addresses = Object.values(interfaces)
    .flat()
    .filter((int): int is NetworkInterfaceInfoIPv4 => int !== undefined);
  const ipv4Addresses = addresses.filter((int) => int.family === 'IPv4');

  return ipv4Addresses;
}
