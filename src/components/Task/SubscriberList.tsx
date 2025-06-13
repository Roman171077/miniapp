import React from "react";
import { Subscriber } from "@/lib/types";

interface SubscriberListProps {
  subscribers: Subscriber[];
}

const SubscriberList: React.FC<SubscriberListProps> = ({ subscribers }) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Номер договора скопирован в буфер обмена");
    });
  };

  const formatAddress = (subscriber: Subscriber) => {
    // Собираем строку адреса с учётом наличия или отсутствия улицы и района
    const addressParts: string[] = [];
    
    // Город всегда присутствует
    addressParts.push(subscriber.city);
    
    // Если район существует, добавляем его
    if (subscriber.district) {
      addressParts.push(subscriber.district);
    }

    // Если улица существует, добавляем её
    if (subscriber.street) {
      addressParts.push(subscriber.street);
    }

    // Дом всегда присутствует
    addressParts.push(subscriber.house);

    return addressParts.join(", ");
  };

  return (
    <div className="space-y-4">
      {subscribers.map((subscriber) => (
        <div
          key={subscriber.contract_number}
          className="p-4 border border-gray-300 rounded-lg shadow-sm"
        >
          <div className="mb-2">
            <span className="font-semibold">Договор: </span>
            <button
              onClick={() => handleCopy(subscriber.contract_number)}
              className="text-blue-500 hover:underline"
            >
              {subscriber.contract_number}
            </button>
          </div>
          <div className="mb-2">
            <span className="font-semibold">Адрес: </span>
            <span>{formatAddress(subscriber)}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold">ФИО: </span>
            <span>
              {subscriber.surname} {subscriber.name} {subscriber.patronymic}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscriberList;
