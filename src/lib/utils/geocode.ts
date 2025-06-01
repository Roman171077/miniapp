// src/lib/utils/geocode.ts

export async function geocodeAddress(
  address: string
): Promise<{
  latitude: number;
  longitude: number;
  fullAddress: string;
}> {
  const YKEY = process.env.NEXT_PUBLIC_YANDEX_API_KEY;
  if (!YKEY) {
    console.warn("NEXT_PUBLIC_YANDEX_API_KEY не задан — вернём (0,0) и пустой адрес");
    return { latitude: 0, longitude: 0, fullAddress: "" };
  }

  const url = "https://geocode-maps.yandex.ru/1.x/";
  const params = new URLSearchParams({
    apikey: YKEY,
    format: "json",
    geocode: address,
  });

  const res = await fetch(`${url}?${params}`);
  if (!res.ok) {
    throw new Error(`Ошибка геокодера Yandex: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const members = data.response.GeoObjectCollection.featureMember;
  if (!members.length) {
    // Если ничего не нашли, возвращаем (0,0) и пустую строку
    return { latitude: 0, longitude: 0, fullAddress: "" };
  }

  // Яндекс вернул GeoObject, у него есть:
  //   .Point.pos — строка "долгота широта"
  //   .metaDataProperty.GeocoderMetaData.text — «полный адрес» (например, "Россия, Москва, улица ...")
  const geoObject = members[0].GeoObject;
  const pos = geoObject.Point.pos.split(" ").map(Number);
  const longitude = pos[0];
  const latitude = pos[1];

  const fullAddress =
    geoObject.metaDataProperty?.GeocoderMetaData?.text ?? "";

  return { latitude, longitude, fullAddress };
}
