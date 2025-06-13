import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";

export default function PainelEventos() {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  useEffect(() => {
    axios.get("https://O-SEU-BACKEND-URL/eventos")
      .then((res) => setEventos(res.data))
      .catch((err) => console.error("Erro ao buscar eventos:", err));
  }, []);

  const abrirDetalhes = (evento) => {
    setEventoSelecionado(evento);
  };

  return (
    <div className="p-4">
      {eventoSelecionado ? (
        <Card className="p-4">
          <CardContent>
            <div className="text-xl font-bold mb-2">Detalhes: {eventoSelecionado.nome}</div>
            <div className="text-sm text-gray-600 mb-2">{eventoSelecionado.data} • {eventoSelecionado.local}</div>
            <div className="text-sm mb-4">Lucro: €{(eventoSelecionado.ganho - eventoSelecionado.gasto).toFixed(2)}</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">ID</th>
                  <th className="text-left py-1">Setor</th>
                  <th className="text-left py-1">Lugar</th>
                  <th className="text-left py-1">Estado</th>
                </tr>
              </thead>
              <tbody>
                {eventoSelecionado.bilhetes.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td>{b.id}</td>
                    <td>{b.setor}</td>
                    <td>{b.lugar}</td>
                    <td>{b.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <Button variant="outline" onClick={() => setEventoSelecionado(null)}>Voltar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventos.map((evento) => {
            const lucro = evento.ganho - evento.gasto;
            return (
              <Card key={evento.id} className="shadow-xl border rounded-2xl">
                <CardContent className="p-4 space-y-2">
                  <div className="text-xl font-bold">{evento.nome}</div>
                  <div className="text-sm text-gray-500">{evento.data} • {evento.local}</div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span>💸 Gasto: €{evento.gasto.toFixed(2)}</span>
                    <span>💰 Ganho: €{evento.ganho.toFixed(2)}</span>
                    <span>
                      📈 Lucro: <b>€{lucro.toFixed(2)}</b>
                    </span>
                  </div>
                  <Badge variant={evento.pago ? "default" : "secondary"} className="mt-2">
                    {evento.pago ? "Pago" : "Por pagar"}
                  </Badge>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" onClick={() => abrirDetalhes(evento)}>
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
