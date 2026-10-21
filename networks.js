// Each network knows how to build two kinds of links:
//   search(q)   - a people search for a full name (plus optional extra words)
//   profile(u)  - a direct profile link for an exact username
// When a network has no native people search, we fall back to a Google
// search limited to that network's domain.

const enc = encodeURIComponent;

export const googleSite = (domain, q) =>
  `https://www.google.com/search?q=${enc(`site:${domain} "${q}"`)}`;

export const NETWORKS = [
  {
    id: 'facebook', name: 'Facebook', color: '#1877F2', label: 'f', domain: 'facebook.com',
    search: (q) => `https://www.facebook.com/search/people/?q=${enc(q)}`,
    profile: (u) => `https://www.facebook.com/${enc(u)}`,
  },
  {
    id: 'instagram', name: 'Instagram', color: '#E1306C', label: 'Ig', domain: 'instagram.com',
    search: (q) => `https://www.instagram.com/explore/search/keyword/?q=${enc(q)}`,
    profile: (u) => `https://www.instagram.com/${enc(u)}/`,
  },
  {
    id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', label: 'in', domain: 'linkedin.com/in',
    search: (q) => `https://www.linkedin.com/search/results/people/?keywords=${enc(q)}`,
    profile: (u) => `https://www.linkedin.com/in/${enc(u)}/`,
  },
  {
    id: 'x', name: 'X (Twitter)', color: '#111111', label: 'X', domain: 'x.com',
    search: (q) => `https://x.com/search?q=${enc(q)}&f=user`,
    profile: (u) => `https://x.com/${enc(u)}`,
  },
  {
    id: 'tiktok', name: 'TikTok', color: '#25F4EE', ink: '#000', label: 'Tt', domain: 'tiktok.com',
    search: (q) => `https://www.tiktok.com/search/user?q=${enc(q)}`,
    profile: (u) => `https://www.tiktok.com/@${enc(u)}`,
  },
  {
    id: 'youtube', name: 'YouTube', color: '#FF0000', label: 'Yt', domain: 'youtube.com',
    // sp=EgIQAg%3D%3D is YouTube's "Channels only" filter.
    search: (q) => `https://www.youtube.com/results?search_query=${enc(q)}&sp=EgIQAg%253D%253D`,
    profile: (u) => `https://www.youtube.com/@${enc(u)}`,
  },
  {
    id: 'threads', name: 'Threads', color: '#000000', label: '@', domain: 'threads.com',
    search: (q) => `https://www.threads.com/search?q=${enc(q)}`,
    profile: (u) => `https://www.threads.com/@${enc(u)}`,
  },
  {
    id: 'telegram', name: 'Telegram', color: '#26A5E4', label: 'Tg', domain: 't.me',
    search: null,
    profile: (u) => `https://t.me/${enc(u)}`,
  },
  {
    id: 'reddit', name: 'Reddit', color: '#FF4500', label: 'R', domain: 'reddit.com/user',
    search: (q) => `https://www.reddit.com/search/?q=${enc(q)}&type=user`,
    profile: (u) => `https://www.reddit.com/user/${enc(u)}/`,
  },
  {
    id: 'vk', name: 'VK', color: '#0077FF', label: 'VK', domain: 'vk.com',
    search: (q) => `https://vk.com/search/people?q=${enc(q)}`,
    profile: (u) => `https://vk.com/${enc(u)}`,
  },
  {
    id: 'ok', name: 'Odnoklassniki', color: '#EE8208', label: 'OK', domain: 'ok.ru',
    search: (q) => `https://ok.ru/search?st.mode=Users&st.query=${enc(q)}`,
    profile: (u) => `https://ok.ru/${enc(u)}`,
  },
  {
    id: 'pinterest', name: 'Pinterest', color: '#E60023', label: 'P', domain: 'pinterest.com',
    search: (q) => `https://www.pinterest.com/search/users/?q=${enc(q)}`,
    profile: (u) => `https://www.pinterest.com/${enc(u)}/`,
  },
  {
    id: 'snapchat', name: 'Snapchat', color: '#FFFC00', ink: '#000', label: 'Sc', domain: 'snapchat.com/add',
    search: null,
    profile: (u) => `https://www.snapchat.com/add/${enc(u)}`,
  },
  {
    id: 'github', name: 'GitHub', color: '#24292F', label: 'Gh', domain: 'github.com',
    search: (q) => `https://github.com/search?q=${enc(q)}&type=users`,
    profile: (u) => `https://github.com/${enc(u)}`,
  },
  {
    id: 'twitch', name: 'Twitch', color: '#9146FF', label: 'Tw', domain: 'twitch.tv',
    search: (q) => `https://www.twitch.tv/search?term=${enc(q)}&type=channels`,
    profile: (u) => `https://www.twitch.tv/${enc(u)}`,
  },
  {
    id: 'medium', name: 'Medium', color: '#000000', label: 'M', domain: 'medium.com',
    search: (q) => `https://medium.com/search/users?q=${enc(q)}`,
    profile: (u) => `https://medium.com/@${enc(u)}`,
  },
];

// Networks shown by default the first time the app opens.
export const DEFAULT_ON = [
  'facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'youtube',
  'threads', 'telegram', 'reddit', 'vk', 'ok', 'github',
];

// One Google search that covers every selected network at once.
export function googleAllLink(term, networks, mode) {
  const sites = networks.map((n) => `site:${n.domain}`).join(' OR ');
  const phrase = mode === 'username' ? term : `"${term}"`;
  return `https://www.google.com/search?q=${enc(`${phrase} (${sites})`)}`;
}

// Build the list of links for one search.
export function buildLinks({ mode, term, extra, networks }) {
  const links = [];
  for (const n of networks) {
    if (mode === 'username') {
      links.push({ network: n, url: n.profile(term), kind: 'Profile' });
    } else {
      const q = extra ? `${term} ${extra}` : term;
      if (n.search) links.push({ network: n, url: n.search(q), kind: 'People search' });
      else links.push({ network: n, url: googleSite(n.domain, term), kind: 'Google search' });
    }
  }
  return links;
}
