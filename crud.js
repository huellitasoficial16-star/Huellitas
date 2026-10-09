// crud.js - lógica compartida por todos los módulos (datos guardados en localStorage)
function initCrud(cfg) {
  const K = 'crud_' + cfg.key;
  let data = JSON.parse(localStorage.getItem(K) || '[]');
  const save = () => localStorage.setItem(K, JSON.stringify(data));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const campo = (f, p) => {
    const id = `${p}_${f.name}`;
    const label = `<label class="form-label" for="${id}">${f.label}</label>`;
    const ctl = f.type === 'select'
      ? `<select class="form-select" id="${id}" name="${f.name}" required>${f.options.map(o => `<option>${o}</option>`).join('')}</select>`
      : `<input class="form-control" type="${f.type || 'text'}" id="${id}" name="${f.name}" required>`;
    return `<div class="mb-3">${label}${ctl}<div class="invalid-feedback">Campo obligatorio</div></div>`;
  };

  const modal = (p, titulo, boton) => `
  <div class="modal fade" id="modal_${p}" tabindex="-1">
    <div class="modal-dialog">
      <form class="modal-content" id="form_${p}" novalidate>
        <div class="modal-header">
          <h5 class="modal-title">${titulo}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" name="id">
          ${cfg.fields.map(f => campo(f, p)).join('')}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${boton}</button>
        </div>
      </form>
    </div>
  </div>`;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">${cfg.title}</h2>
      <button class="btn btn-success" id="btnAgregar">+ Agregar</button>
    </div>
    <div class="table-responsive">
      <table class="table table-striped table-hover align-middle">
        <thead class="table-dark">
          <tr><th>#</th>${cfg.fields.map(f => `<th>${f.label}</th>`).join('')}<th class="text-end">Acciones</th></tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>
    ${modal('insertar', 'Agregar registro', 'Guardar')}
    ${modal('actualizar', 'Actualizar registro', 'Actualizar')}
    <div class="modal fade" id="modal_borrar" tabindex="-1">
      <div class="modal-dialog"><div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Confirmar</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">¿Seguro que quieres eliminar este registro?</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button class="btn btn-danger" id="btnConfirmarBorrar">Eliminar</button>
        </div>
      </div></div>
    </div>`;

  const mIns = new bootstrap.Modal('#modal_insertar');
  const mAct = new bootstrap.Modal('#modal_actualizar');
  const mDel = new bootstrap.Modal('#modal_borrar');
  const fIns = document.getElementById('form_insertar');
  const fAct = document.getElementById('form_actualizar');
  let borrarId = null;

  function render() {
    const tb = document.getElementById('tbody');
    if (!data.length) {
      tb.innerHTML = `<tr><td colspan="${cfg.fields.length + 2}" class="text-center text-muted">Sin registros</td></tr>`;
      return;
    }
    tb.innerHTML = data.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        ${cfg.fields.map(f => `<td>${esc(r[f.name])}</td>`).join('')}
        <td class="text-end">
          <button class="btn btn-sm btn-warning" data-act="edit" data-id="${r.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-act="del" data-id="${r.id}">Eliminar</button>
        </td>
      </tr>`).join('');
  }

  const leer = form => Object.fromEntries(new FormData(form));

  document.getElementById('btnAgregar').onclick = () => {
    fIns.reset(); fIns.classList.remove('was-validated'); mIns.show();
  };

  fIns.onsubmit = e => {
    e.preventDefault();
    if (!fIns.checkValidity()) return fIns.classList.add('was-validated');
    const r = leer(fIns); r.id = Date.now();
    data.push(r); save(); render(); mIns.hide();
  };

  fAct.onsubmit = e => {
    e.preventDefault();
    if (!fAct.checkValidity()) return fAct.classList.add('was-validated');
    const r = leer(fAct);
    data = data.map(x => String(x.id) === r.id ? { ...r, id: x.id } : x);
    save(); render(); mAct.hide();
  };

  document.getElementById('tbody').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'edit') {
      const r = data.find(x => String(x.id) === id);
      fAct.classList.remove('was-validated');
      fAct.elements['id'].value = r.id;
      cfg.fields.forEach(f => fAct.elements[f.name].value = r[f.name]);
      mAct.show();
    } else {
      borrarId = id; mDel.show();
    }
  };

  document.getElementById('btnConfirmarBorrar').onclick = () => {
    data = data.filter(x => String(x.id) !== borrarId);
    save(); render(); mDel.hide();
  };

  render();
}
