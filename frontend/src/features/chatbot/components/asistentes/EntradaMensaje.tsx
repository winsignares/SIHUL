import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Zap } from 'lucide-react';
import type { useAsistentesVirtuales } from '../../hooks/useAsistentesVirtuales';

type Hook = ReturnType<typeof useAsistentesVirtuales>;
type Asistente = NonNullable<Hook['asistenteActivo']>;

type Props = Pick<Hook, 'inputMensaje' | 'setInputMensaje' | 'handleKeyPress' | 'enviarMensaje' | 'isTyping'> & {
  asistenteActivo: Asistente;
};

/** Caja de texto y botón de envío. */
export function EntradaMensaje({
  asistenteActivo,
  inputMensaje,
  setInputMensaje,
  handleKeyPress,
  enviarMensaje,
  isTyping
}: Props) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 relative z-10">
      <div className="flex gap-2">
        <Input
          value={inputMensaje}
          onChange={(e) => setInputMensaje(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Escribe un mensaje a ${asistenteActivo.nombre}...`}
          className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500/20"
        />
        <Button
          onClick={enviarMensaje}
          disabled={!inputMensaje.trim() || isTyping}
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/20"
        >
          <Zap className="w-4 h-4" />
        </Button>
      </div>
      <div className="text-center mt-2">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Presiona Enter para enviar
        </span>
      </div>
    </div>
  );
}
