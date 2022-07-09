const express = require('express');
const os = require('os');

function belongsToSubnet(ip, mask, subnet) {
  const ipBytes = ip.split('.').map(octet => parseInt(octet));
  const subnetBytes = subnet.split('.').map(octet => parseInt(octet));
  const maskBytes = mask.split('.').map(octet => parseInt(octet));

  return ipBytes.every((ipByte, i) => {
    return (ipByte & maskBytes[i]) === subnetBytes[i];
  });
}

function getLANIP(subnet) {
  const interfaces = getIPv4Interfaces();

  const lanInterface = interfaces.find(int => {
    const ip = int.address;
    const netmask = int.netmask;

    return belongsToSubnet(ip, netmask, subnet);
  });

  return lanInterface.address;
}

function getIPv4Interfaces() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(int => int.family === 'IPv4');
}

module.exports = {
  getLANIP,
};