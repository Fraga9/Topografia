import React from 'react';

const Alertas = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
    <h1 className="text-2xl font-bold mb-4 text-blue-800">Alertas</h1>
    <p className="text-gray-700 mb-2">Aquí se mostrarán las alertas recientes del sistema y notificaciones importantes para el usuario.</p>
    <ul className="list-disc pl-6 text-gray-600">
      <li>Alerta de calibración pendiente.</li>
      <li>Nuevo reporte disponible.</li>
      <li>Actualización de proyecto programada.</li>
    </ul>
  </div>
);

export default Alertas;
