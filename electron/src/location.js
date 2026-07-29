// API 키 없이 동작하는 무료 IP 위치 조회 + 날씨(Open-Meteo) 모듈

const WEATHER_CODE_KO = {
  0: '맑음', 1: '대체로 맑음', 2: '구름 조금', 3: '흐림',
  45: '안개', 48: '서리 안개',
  51: '가벼운 이슬비', 53: '이슬비', 55: '강한 이슬비',
  61: '약한 비', 63: '비', 65: '강한 비',
  66: '어는 비', 67: '강한 어는 비',
  71: '약한 눈', 73: '눈', 75: '강한 눈', 77: '싸락눈',
  80: '약한 소나기', 81: '소나기', 82: '강한 소나기',
  85: '약한 눈 소나기', 86: '강한 눈 소나기',
  95: '뇌우', 96: '우박 동반 뇌우', 99: '강한 우박 동반 뇌우',
};

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getLocation() {
  // 1차: geojs (https, 무료, 키 불필요)
  try {
    const g = await fetchJson('https://get.geojs.io/v1/ip/geo.json');
    return {
      lat: parseFloat(g.latitude),
      lon: parseFloat(g.longitude),
      city: g.city || '내 위치',
      timezone: g.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch (_) {
    // 2차 폴백: ipapi.co
    const a = await fetchJson('https://ipapi.co/json/');
    return {
      lat: a.latitude,
      lon: a.longitude,
      city: a.city || '내 위치',
      timezone: a.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`;
  const data = await fetchJson(url);
  const cur = data.current || {};
  return {
    temp: Math.round(cur.temperature_2m),
    humidity: cur.relative_humidity_2m,
    windSpeed: cur.wind_speed_10m,
    code: cur.weather_code,
    description: WEATHER_CODE_KO[cur.weather_code] || '알 수 없음',
  };
}

function getLocalTime(timezone) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const parts = fmt.formatToParts(now).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    hour: parts.hour,
    minute: parts.minute,
    weekday: parts.weekday,
    dateText: `${parts.year}년 ${parts.month} ${parts.day}`,
  };
}

module.exports = { getLocation, getWeather, getLocalTime };
