import React, { useState, useEffect } from 'react';

function Disputas() {
  // Estado para armazenar as vendas e as disputas
  const [registos, setRegistos] = useState([]);  // Lista de vendas
  const [disputas, setDisputas] = useState([]);  // Lista de disputas

  // Simulando a obtenção de dados da API (substitua com dados reais)
  useEffect(() => {
    const dadosFicticios = [
      { id: 1, evento: 'Evento A', ganho: 500, estado: 'Por entregar', cobranca: 450, dataDisputa: '' },
      { id: 2, evento: 'Evento B', ganho: 1000, estado: 'Disputa', cobranca: 950, dataDisputa: '2023-07-23' },
      { id: 3, evento: 'Evento C', ganho: 700, estado: 'Pago', cobranca: 0, dataDisputa: '' }
    ];
    setRegistos(dadosFicticios);  // Preenche a lista de vendas
  }, []);

  // Função para alterar o estado para "Disputa" e
