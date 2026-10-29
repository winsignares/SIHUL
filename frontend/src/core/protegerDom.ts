// El traductor automático del navegador y algunas extensiones envuelven los textos de la página en etiquetas propias
// (<font>). Cuando React después intenta quitar o insertar un nodo que ya no está donde él lo dejó, el navegador lanza
// «NotFoundError: Failed to execute 'removeChild' on 'Node'» y toda la pantalla cae en «Algo salió mal».
// Estas dos funciones toleran ese caso en vez de lanzar el error (solución habitual descrita en facebook/react#11538).
let aplicado = false;

export function protegerDomContraModificacionesExternas(): void {
  if (aplicado || typeof Node === 'undefined') return;
  aplicado = true;

  const quitarOriginal = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChildSeguro<T extends Node>(this: Node, hijo: T): T {
    if (hijo.parentNode !== this) {
      return hijo;
    }
    return quitarOriginal.call(this, hijo) as T;
  };

  const insertarOriginal = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBeforeSeguro<T extends Node>(this: Node, nuevo: T, referencia: Node | null): T {
    if (referencia && referencia.parentNode !== this) {
      return nuevo;
    }
    return insertarOriginal.call(this, nuevo, referencia) as T;
  };
}
