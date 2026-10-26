import fs from 'fs';
import path from 'path';

// Récupération de la clé depuis les variables d'environnement ou le fichier mcp_config.json local
function getNotionKey() {
  if (process.env.NOTION_API_KEY) return process.env.NOTION_API_KEY;
  try {
    const mcpPath = path.resolve('.agents/mcp_config.json');
    if (fs.existsSync(mcpPath)) {
      const config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
      if (config?.mcpServers?.notion?.env?.NOTION_API_KEY) {
        return config.mcpServers.notion.env.NOTION_API_KEY;
      }
    }
  } catch (e) {}
  return "";
}

const NOTION_API_KEY = getNotionKey();

async function fetchBlocks(blockId) {
  let results = [];
  let cursor = undefined;

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) url.searchParams.set("start_cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28"
      }
    });
    const data = await res.json();
    if (data.results) results = results.concat(data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

export async function getNotionCorrections() {
  const pageId = "401d39dc-b430-8330-acf3-01b102e63c93";
  const blocks = await fetchBlocks(pageId);
  const lines = [];

  for (const b of blocks) {
    const type = b.type;
    const textArr = b[type]?.rich_text || [];
    const text = textArr.map(t => t.plain_text).join("");

    if (type === "to_do") {
      lines.push(`- [${b.to_do.checked ? "x" : " "}] ${text}`);
    } else if (type === "bulleted_list_item") {
      lines.push(`• ${text}`);
    } else if (type === "numbered_list_item") {
      lines.push(`1. ${text}`);
    } else if (type.startsWith("heading")) {
      lines.push(`\n## ${text}`);
    } else if (text) {
      lines.push(text);
    }
  }

  return lines.join("\n");
}

async function main() {
  console.log("Lecture en direct de la page Notion 'Correction Le CI'...");
  const content = await getNotionCorrections();
  const dest = path.resolve('NOTION_CORRECTIFS.md');
  fs.writeFileSync(dest, `# Correctifs & Améliorations Notion (Synchronisé le ${new Date().toLocaleString('fr-FR')})\n\n${content}`, 'utf-8');
  console.log("Synchronisation réussie dans NOTION_CORRECTIFS.md !");
}

main();
