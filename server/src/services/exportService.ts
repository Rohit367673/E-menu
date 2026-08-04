import puppeteer from 'puppeteer';
import { renderModernCafe } from '../templates/export/modernCafe.js';
import { renderDarkRestaurant } from '../templates/export/darkRestaurant.js';
import { renderClassicMenu } from '../templates/export/classicMenu.js';
import type { ExportMenuData } from '../templates/export/modernCafe.js';

export type ExportTemplateId = 'modern-cafe' | 'dark-restaurant' | 'classic-menu';

const templateRenderers: Record<ExportTemplateId, (data: ExportMenuData) => string> = {
  'modern-cafe': renderModernCafe,
  'dark-restaurant': renderDarkRestaurant,
  'classic-menu': renderClassicMenu,
};

export function renderExportHtml(templateId: ExportTemplateId, data: ExportMenuData): string {
  const renderer = templateRenderers[templateId];
  if (!renderer) {
    throw new Error(`Unknown export template: ${templateId}`);
  }
  return renderer(data);
}

export async function generatePdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generatePng(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));
    const bodyHandle = await page.$('body');
    if (!bodyHandle) throw new Error('Failed to render export page');

    const boundingBox = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    if (boundingBox) {
      await page.setViewport({
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height),
        deviceScaleFactor: 2,
      });
    }

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false,
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}
