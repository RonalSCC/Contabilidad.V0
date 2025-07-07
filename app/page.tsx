"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "ai/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Calculator, MessageCircle, Minimize2, Maximize2, Download } from "lucide-react"
import { connection } from "./CosmosHubConnection";
import Markdown from "react-markdown"
import { AsientoContable } from "./ContableModels"
interface AccountingEntry {
  date: string
  number: string
  third_party: string
  description: string
  entries: Array<{
    account: string
    account_name: string
    cost_center: string
    debit: number
    credit: number
    description: string
  }>
}
interface Message {
  text: Response,
  role: "user" | "assistant"
}

interface Response {
  message: string,
  idAsiento?: string;
}

export default function AccountingChatApp() {

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("");
  const [asientoContable, setAsientoContable] = useState<AsientoContable>();

  const [isChatMinimized, setIsChatMinimized] = useState(false)

  const chatRef = useRef<HTMLDivElement>(null);
  const totalDebit = asientoContable?.partidasContables.reduce((sum, entry) => sum + entry.valorDebito.valor, 0)
  const totalCredit = asientoContable?.partidasContables.reduce((sum, entry) => sum + entry.valorCredito.valor, 0)
  const isBalanced = Math.abs((totalDebit ?? 0) - (totalCredit ?? 0)) < 0.01

  const exportToPDF = async () => {
    window.print();
  }

  const sendMessageToHub = (message: string) => {
    connection.invoke("ReceiveMessage", message);
    setMessages((prev) => [...prev, { text: { message }, role: "user" }]);
    setInput(""); // Limpiar el input después de enviar el mensaje
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    connection.off("ReceiveMessage");
    connection.on("ReceiveMessage", (message: Response[]) => {

      var assistantMessage = message.map((msg): Message => ({role: "assistant", text: msg}));  
      setMessages((prev) => [...prev, ...assistantMessage]);

      var anyAsiento = message.find((msg) => msg.idAsiento);
      if (anyAsiento) {
        alert("Asiento contable actualizado: " + anyAsiento.idAsiento);

        fetch("http://localhost:8092/asientocontable/" + anyAsiento.idAsiento).then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Error al obtener el asiento contable");
          }
        }).then((data: AsientoContable) => { setAsientoContable(data) });
      }
      chatRef.current?.scrollIntoView({ behavior: "smooth" });

    });

    return () => {
      connection.stop
    }
  }, [])


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              Sistema Contable Inteligente
            </h1>
            <p className="text-gray-600 text-sm mt-1">Registra asientos contables usando lenguaje natural</p>
          </div>
        </div>
      </div>

      {/* Main Content - Libro Contable */}
      <div className="pb-80">
        {" "}
        {/* Espacio para el chat fijo */}
        <div className="max-w-7xl mx-auto p-4">
          <Card className="bg-white border border-gray-200 min-h-[calc(100vh-200px)]">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-6">
                  {/* Encabezado del Asiento */}
                  <div className="mb-6 pb-4 border-b-2 border-gray-400">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-lg font-bold text-gray-800">Asiento No. {asientoContable?.identificacionContable.consecutivo || "001"}</div>
                      <div className="text-sm font-semibold text-gray-700">
                        Fecha: {asientoContable?.fechaFiscal || new Date().toISOString().split("T")[0]}
                      </div>
                    </div>

                    {asientoContable?.partidasContables[0].tercero && (
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold">Tercero:</span> {asientoContable.partidasContables[0].tercero.numeroIdentificacion}
                      </div>
                    )}

                  </div>

                  {/* Tabla del Libro Contable */}
                  {asientoContable?.partidasContables.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                      <div className="text-6xl mb-4">📖</div>
                      <p className="text-lg font-medium">Libro en blanco</p>
                      <p className="text-sm mt-2">Describe el movimiento contable en el chat inferior</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {/* Encabezados de la tabla */}
                      <div className="grid grid-cols-12 gap-1 text-xs font-bold text-gray-800 bg-gray-100 p-2 border-2 border-gray-400">
                        <div className="col-span-1 text-center">Código</div>
                        <div className="col-span-4">Nombre de la cuenta</div>
                        <div className="col-span-2 text-center">Centro de costo</div>
                        <div className="col-span-2 text-right">Débito</div>
                        <div className="col-span-2 text-right">Crédito</div>
                        <div className="col-span-1 text-center">Ref</div>
                      </div>

                      {/* Líneas del asiento */}
                      {asientoContable?.partidasContables.map((entry, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-1 text-sm border-b border-gray-300 py-2 hover:bg-gray-50"
                        >
                          <div className="col-span-1 text-center font-mono font-semibold text-blue-700">
                            {entry.cuentaContable.codigo}
                          </div>
                          <div className="col-span-4 font-medium text-gray-800">
                            {entry.cuentaContable.nombre}
                            {entry.descripcion && (
                              <div className="text-xs text-gray-600 italic mt-1">{entry.descripcion}</div>
                            )}
                          </div>
                          <div className="col-span-2 text-center text-xs text-gray-600">{entry.centroCosto?.nombre || "-"}</div>
                          <div className="col-span-2 text-right font-mono">
                            {entry.valorDebito.valor > 0 ? (
                              <span className="text-green-700 font-semibold">
                                ${entry.valorDebito.valor.toLocaleString("es-CO")}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right font-mono">
                            {entry.valorCredito.valor > 0 ? (
                              <span className="text-red-700 font-semibold">
                                ${entry.valorCredito.valor.toLocaleString("es-CO")}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-1 text-center text-xs text-gray-500">{index + 1}</div>
                        </div>
                      ))}

                      {/* Línea de totales */}
                      <div className="grid grid-cols-12 gap-1 text-sm font-bold bg-gray-200 border-2 border-gray-400 py-3 mt-4">
                        <div className="col-span-7 text-right pr-4 text-gray-800">Sumas iguales:</div>
                        <div className="col-span-2 text-right font-mono text-green-700">
                          ${totalDebit?.toLocaleString("es-CO")}
                        </div>
                        <div className="col-span-2 text-right font-mono text-red-700">
                          ${totalCredit?.toLocaleString("es-CO")}
                        </div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Estado del balance */}
                      <div className="mt-4 text-center">
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${isBalanced
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                            }`}
                        >
                          {isBalanced ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Asiento balanceado
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Asiento desbalanceado
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pie de página */}
                  <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
                    Página 1 | Libro Diario | {new Date().toLocaleDateString("es-CO")}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Fijo en la Parte Inferior */}
      <div ref={chatRef} className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto">
          {/* Header del Chat */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Asistente Contable</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatMinimized(!isChatMinimized)}
              className="text-blue-600 hover:bg-blue-100"
            >
              {isChatMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Contenido del Chat */}
          {!isChatMinimized && (
            <div className="p-4">
              {/* Historial de mensajes */}
              <ScrollArea className="h-48 mb-4 p-3 bg-gray-50 rounded-lg border">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <p className="mb-2">¡Hola! Soy tu asistente contable.</p>
                      <div className="text-xs space-y-1 bg-white p-3 rounded border">
                        <p>
                          <strong>Ejemplos:</strong>
                        </p>
                        <p>"Cuenta por pagar del agua por $1,000,000 pesos"</p>
                        <p>"Venta de mercancía por $1,200,000 con IVA"</p>
                        <p>"Pago de nómina por $2,000,000"</p>
                      </div>
                    </div>
                  )}
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-2 rounded-lg text-sm ${message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                          }`}
                      >
                        {message.role === "assistant" && message.text.message.startsWith("{") ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Asiento contable actualizado
                          </div>
                        ) : <Markdown>
                          {message.text.message}
                        </Markdown>

                        }
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input del Chat */}
              <div className="flex gap-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe el asiento contable..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessageToHub(input);
                    }
                  }}
                />
                <Button onClick={() => sendMessageToHub(input)} type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
