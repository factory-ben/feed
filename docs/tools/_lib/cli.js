function parseArgs(argv = []) {
  const options = {};
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('-')) {
      positionals.push(token);
      continue;
    }

    if (token === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }

    const [key, value] = token.split('=');
    const normalizedKey = key.replace(/^-+/, '');

    if (typeof value !== 'undefined') {
      options[normalizedKey] = value;
    } else {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        options[normalizedKey] = true;
      } else {
        options[normalizedKey] = next;
        i += 1;
      }
    }
  }

  return { options, positionals };
}

module.exports = {
  parseArgs,
};
