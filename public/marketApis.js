// marketApis.js
const BASE_URL = '/api';

async function fetchJSON(path) {
  const res = await fetch(`${BASE_URL}/${path}`);
  if (!res.ok) throw new Error(`Erro ao buscar ${path}: ${res.status}`);
  return res.json();
}

export async function getPSIData() {
  return fetchJSON('tickers');
}

export async function getIBEXData() {
  return fetchJSON('ibex');
}

export async function getNASDAQData() {
  return fetchJSON('nasdaq');
}

export async function getParisData() {
  return fetchJSON('paris');
}

export async function getAllMarkets() {
  const [psi, ibex, nasdaq, paris] = await Promise.all([
    getPSIData(),
    getIBEXData(),
    getNASDAQData(),
    getParisData()
  ]);
  return { psi, ibex, nasdaq, paris };
}
