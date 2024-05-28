const cp = require('child_process');

function copy(output) {
  if (output) {
    output = output.trim();
    cp.spawnSync('pbcopy', {
      encoding: 'utf8',
      input: output,
    });
    console.log(output);
  }
}

function extractContent(data) {
  // Extract JSON content by looking for balanced braces
  let jsonMatch = data.match(/{[\s\S]*}|\[[\s\S]*\]/s);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Extract XML content by looking for balanced tags
  let xmlMatch = data.match(/<\?xml[^>]*\?>[\s\S]*<\/[^>]+>/s);
  if (!xmlMatch) {
    xmlMatch = data.match(/<[^>]+>[\s\S]*<\/[^>]+>/s);
  }
  if (xmlMatch) {
    return xmlMatch[0];
  }

  return null;
}

function beautify() {
  const code = cp.spawnSync('pbpaste', {
    encoding: 'utf8',
  }).stdout;

  const content = extractContent(code);
  if (!content) {
    console.log('No XML or JSON found in the input.');
    return;
  }

  let tidied = '';

  try {
    // Try to parse as JSON
    const json = JSON.parse(content);
    tidied = JSON.stringify(json, null, 2);
    copy(tidied);
    return;
  } catch (e) {
    // Not JSON, proceed to try XML
    console.error("JSON parsing error: ", e.message);
  }

  try {
    // Try to format as XML
    const output = cp.spawnSync('tidy', ['-utf8', '-i', '-xml'], {
      encoding: 'utf8',
      input: content,
    });

    if (output.stdout) {
      tidied = output.stdout;
    } else if (output.stderr) {
      tidied = output.stderr;
    }
    copy(tidied);
  } catch (e) {
    // Handle any errors if needed
    console.error("XML formatting error: ", e.message);
  }
}

beautify();
