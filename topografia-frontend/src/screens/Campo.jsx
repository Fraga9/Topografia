import React from 'react';

const Campo = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
    <h1 className="text-2xl font-bold mb-4 text-green-800">Campo</h1>
    <p className="text-gray-700 mb-2">Gestión de actividades y registros realizados en campo.</p>
    <div className="mt-4">
      <p className="text-gray-600">No hay registros recientes de campo. Agrega una nueva actividad para comenzar.</p>
    </div>
  </div>
);

export default Campo;
