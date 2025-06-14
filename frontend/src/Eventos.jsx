import { useEffect, useState } from "react";

export default function Eventos() {
  const [registos, setRegistos] = useState([]);
  const [eventosDropdown, setEventosDropdown] = useState([]);
  const [novoRegisto, setNovoRegisto] = useState({
    data_evento: "",
    evento: "",
    estadio: "",
    gasto: "",
    ganho: "",
    estado: "Por entregar"
  });
  const [modoEdicao, setModoEdicao] = useState(null);
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [compras, setCompras] = useState([]);

  useEffect(() => {
    buscarEventos();
    buscarDropdown();
    buscarVendas();
    buscarCompras();
  }, []);

  const buscarEventos = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_completos2");
    if (res.ok) {
      const data = await res.json();
      setRegistos(data);
    } else {
      console.error("Erro ao carregar eventos.");
    }
  };

  const buscarDropdown = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/eventos_dropdown");
    if (res.ok) {
      const data = await res.json();
      setEventosDropdown(data);
    } else {
      console.error("Erro ao carregar dropdown.");
    }
  };

  const buscarVendas = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/listagem_vendas");
    if (res.ok) {
      setVendas(await res.json());
    }
  };

  const buscarCompras = async () => {
    const res = await fetch("https://controlo-bilhetes.onrender.com/compras");
    if (res.ok) {
      setCompras(await res.json());
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoRegisto((prev) => ({ ...prev, [name]: value }));
  };

  const editarRegisto = (registo) => {
    setModoEdicao(registo.id);
    setNovoRegisto({ ...registo });
  };

  const atualizarRegisto = async () => {
    const eventoVendas = vendas.filter(v => v.evento === novoRegisto.evento);
    const eventoCompras = compras.filter(c => c.evento === novoRegisto.evento);
    const novoGanho = eventoVendas.reduce((s, v) => s + v.ganho, 0);
    const novoGasto = eventoCompras.reduce((s, c) => s + c.gasto, 0);

    const res = await fetch('https://controlo-bilhetes.onrender.com/eventos_completos2/' + modoEdicao, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoRegisto,
        ganho: novoGanho,
        gasto: novoGasto
      })
    });

    if (res.ok) {
      setModoEdicao(null);
      setNovoRegisto({
        data_evento: "",
        evento: "",
        estadio: "",
        gasto: "",
        ganho: "",
        estado: "Por entregar"
      });
      buscarEventos();
    } else {
      console.error("Erro ao atualizar evento.");
    }
  };

  return <div>Atualização concluída. Esta versão calcula gasto e ganho automaticamente.</div>;
}
