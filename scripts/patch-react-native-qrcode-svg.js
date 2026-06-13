const fs = require('fs')
const path = require('path')

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-qrcode-svg',
  'src',
  'LogoSVG',
  'index.native.js'
)

if (!fs.existsSync(target)) {
  console.log('[patch-react-native-qrcode-svg] target not found, skipping')
  process.exit(0)
}

const original = fs.readFileSync(target, 'utf8')

if (original.includes("SvgUri, SvgXml } from \"react-native-svg\";") &&
    !original.includes('react-native-svg/css')) {
  console.log('[patch-react-native-qrcode-svg] already patched')
  process.exit(0)
}

const replacement = `import React from "react";
import { SvgUri, SvgXml } from "react-native-svg";
import { isString, isUrlString } from "../utils";

const LogoSVG = ({ svg, logoSize, logoColor }) => {
  if (!svg) {
    return null;
  }

  if (isString(svg)) {
    if (isUrlString(svg)) {
      return (
        <SvgUri uri={svg} fill={logoColor} width={logoSize} height={logoSize} />
      );
    }

    return (
      <SvgXml xml={svg} fill={logoColor} width={logoSize} height={logoSize} />
    );
  }

  return null;
};

export default LogoSVG;
`

fs.writeFileSync(target, replacement)
console.log('[patch-react-native-qrcode-svg] patched successfully')
