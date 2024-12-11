document.addEventListener('DOMContentLoaded', function() {
    
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const alertError = document.getElementById('alertError');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const dashboardContainerUser = document.getElementById('dashboardContainerUser');
    const loginContainer = document.getElementById('loginContainer');
    const cadastrarModal = new bootstrap.Modal(document.getElementById('cadastrarModal'));
    const editarRemoverModal = new bootstrap.Modal(document.getElementById('editarRemoverModal'));
    const departamentoModal = new bootstrap.Modal(document.getElementById('departamentoModal'));
    const cadastrarBtn = document.getElementById('cadastrarBtn');
    const userCountBadge = document.getElementById('userCountBadge');
    const editarBtn = document.getElementById('editarBtn');
    const removerBtn = document.getElementById('removerBtn');
    const tipoDepartamentoSelect = document.getElementById('tipo_departamento');
    const tipoDepartamentoEditarSelect = document.getElementById('tipo_departamentoEditar');
    const listaDepartamentos = document.getElementById('listaDepartamentos');
    const novoDepartamentoInput = document.getElementById('novoDepartamento');
    const adicionarDepartamentoBtn = document.getElementById('adicionarDepartamentoBtn');
    let currentUserId;
    let confirmDelete = false;

    // Validação de Inputs
    function validateInputs() {
        loginButton.disabled = !(emailInput.value && passwordInput.value);
    }

    // Função para Decodificar JWT
    function base64DecodeUnicode(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    function parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64DecodeUnicode(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(base64);
    }

    // Função para Exibir Alertas
    function showAlert(alertElement, type, message, autoHide = true) {
        alertElement.className = `alert alert-${type}`;
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        if (autoHide) {
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 3000);
        }
    }

    // Função Fetch API
    function fetchAPI(endpoint, options = {}) {
        const token = localStorage.getItem('userToken');
        return fetch(`http://127.0.0.1:5000/${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        }).then(response => {
            if (!response.ok) {
                throw new Error('Erro na requisição');
            }            
            if (response.status === 204) {
                return null;
            }
            return response.json();
        });
    }

    // Carregar Usuários
    function fetchUsuarios() {
        fetchAPI('api/usuarios')
            .then(data => {
                $('#usuariosTable').DataTable({
                    data: data.response,
                    columns: [
                        { data: 'id' },
                        { data: 'nome' },
                        { data: 'email' },
                        { data: 'departamento' },
                        { data: 'tipo_usuario' },
                        {
                            data: null,
                            className: "center",
                            defaultContent: '<button type="button" class="btn btn-sm btn-orange edit-btn">Editar</button>'
                        }
                    ],
                    destroy: true,
                    responsive: true,
                    language: {
                        search: "Pesquisar:",
                        lengthMenu: "Mostrar _MENU_ registros por página",
                        info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                        infoEmpty: "Mostrando 0 a 0 de 0 registros",
                        infoFiltered: "(filtrado de _MAX_ registros totais)",
                        paginate: {
                            first: "Primeiro",
                            last: "Último",
                            next: "Próximo",
                            previous: "Anterior"
                        }
                    }
                });

                userCountBadge.textContent = data.response.length;
                
                $('#usuariosTable tbody').off('click', 'button.edit-btn').on('click', 'button.edit-btn', handleEditModal);
            })
            .catch(error => showAlert(alertError, 'danger', error.message));
    }

    // Logar Usuário
    function login() {
        fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput.value, senha: passwordInput.value })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "error") {
                showAlert(alertError, 'danger', data.response);
            } else {
                const decodedToken = parseJwt(data.token);
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userName', decodedToken.nome);
                localStorage.setItem('userType', decodedToken.tipo_usuario);

                loginContainer.style.display = 'none';
                dashboardContainer.style.display = 'block';
                document.getElementById('navBar').querySelector('.navbar-brand').textContent = `Bem-vindo, ${decodedToken.nome}`;
                fetchUsuarios();
            }
        })
        .catch(error => showAlert(alertError, 'danger', error.message));
    }

    // Logout
    function logout() {
        ['userToken', 'userName', 'userType'].forEach(item => localStorage.removeItem(item));
        loginContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
        dashboardContainerUser.style.display = 'none';
    }

    // Carregar Departamentos
    function fetchDepartamentos(callback) {
        fetchAPI('api/departamento')
            .then(data => callback(data.response))
            .catch(error => console.error('Erro:', error));
    }

    // Carregar Departamentos no Modal do Usuário
    function handleUserModal() {
        fetchDepartamentos(departamentos => populateSelect(tipoDepartamentoSelect, departamentos));
    }

    // Criar Usuário
    function createUser() {
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const tipoUsuario = document.getElementById('tipo_usuario').value;
        const departamentoNome = tipoDepartamentoSelect.options[tipoDepartamentoSelect.selectedIndex].textContent;

        fetchAPI('api/usuario', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha, tipo_usuario: tipoUsuario, departamento: departamentoNome })
        })
        .then(() => {
            showAlert(alertMessageEdit, 'success', 'Usuário criado com sucesso!');
            fetchUsuarios();
            setTimeout(() => cadastrarModal.hide(), 2000);
        })
        .catch(error => showAlert(alertMessageEdit, 'danger', error.message));
    }

    
    function handleEditModal(event) {
        const data = $('#usuariosTable').DataTable().row($(this).closest('tr')).data();
        currentUserId = data.id;
        $('#editNome').val(data.nome);
        $('#editEmail').val(data.email);
        $('#editSenha').val('');
        $('#editTipoUsuario').val(data.tipo_usuario);

        fetchDepartamentos(departamentos => {
            populateSelect(tipoDepartamentoEditarSelect, departamentos, data.departamento.id);
            editarRemoverModal.show(); // Mostra o modal após os departamentos terem sido carregados
        });
    }

    // Atualizar Usuário
    function updateUser() {
        const nome = document.getElementById('editNome').value;
        const email = document.getElementById('editEmail').value;
        const senha = document.getElementById('editSenha').value;
        const tipoUsuario = document.getElementById('editTipoUsuario').value;
        const departamentoNome = tipoDepartamentoEditarSelect.options[tipoDepartamentoEditarSelect.selectedIndex].textContent;

        fetchAPI(`api/usuario/${currentUserId}`, {
            method: 'PUT',
            body: JSON.stringify({ nome, email, senha, tipo_usuario: tipoUsuario, departamento: departamentoNome })
        })
        .then(() => {
            showAlert(alertMessageEdit, 'success', 'Usuário atualizado com sucesso!');
            fetchUsuarios();
            setTimeout(() => editarRemoverModal.hide(), 2000);
        })
        .catch(error => showAlert(alertMessageEdit, 'danger', error.message));
    }

    // Deletar Usuário
    function deleteUser() {
        if (!confirmDelete) {
            confirmDelete = true;
            removerBtn.textContent = 'Confirmar exclusão?';
            return;
        }
    
        fetchAPI(`api/usuario/${currentUserId}`, { method: 'DELETE' })
            .then(() => {
                showAlert(alertMessageEdit, 'success', 'Usuário deletado com sucesso!');
                fetchUsuarios();
                confirmDelete = false;
                removerBtn.textContent = 'Remover';
                setTimeout(() => editarRemoverModal.hide(), 2000);
            })
            .catch(error => showAlert(alertMessageEdit, 'danger', error.message));
    }

    // Carregar Modal de Departamentos
    function handleDepartmentModal() {
        fetchDepartamentos(departamentos => populateDepartamentos(departamentos));
    }

    // Adicionar Novo Departamento
    function addDepartamento() {
        const nome = novoDepartamentoInput.value.trim();
        if (nome) {
            fetchAPI('api/departamento', { method: 'POST', body: JSON.stringify({ nome }) })
                .then(() => {
                    showAlert(departamentoAlert, 'success', 'Departamento adicionado com sucesso!');
                    handleDepartmentModal();
                })
                .catch(error => showAlert(departamentoAlert, 'danger', error.message));
        } else {
            showAlert(departamentoAlert, 'warning', 'Nome do departamento não pode estar vazio');
        }
    }

    // Deletar Departamento
    function deleteDepartamento(id, element) {
        fetchAPI(`api/departamento/${id}`, { method: 'DELETE' })
            .then(() => {
                showAlert(departamentoAlert, 'success', 'Departamento excluído com sucesso!');
                element.remove();
            })
            .catch(error => showAlert(departamentoAlert, 'danger', error.message));
    }

    // Popular Departamentos no HTMLElement
    function populateDepartamentos(departamentos) {
        listaDepartamentos.innerHTML = '';
        departamentos.forEach(depto => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.textContent = depto.nome;
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn btn-sm btn-danger';
            btnEliminar.textContent = 'Excluir';
            btnEliminar.addEventListener('click', () => deleteDepartamento(depto.id, li));
            li.appendChild(btnEliminar);
            listaDepartamentos.appendChild(li);
        });
    }

    // Popular Selects
    function populateSelect(selectElement, items, selectedId = null) {
        selectElement.innerHTML = '';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nome;
            if (item.id === selectedId) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    // Eventos
    emailInput.addEventListener('input', validateInputs);
    passwordInput.addEventListener('input', validateInputs);
    loginButton.addEventListener('click', login);
    document.querySelector('.btn-orange').addEventListener('click', logout);
    document.querySelector('.btn-orange2').addEventListener('click', logout);
    cadastrarBtn.addEventListener('click', createUser);
    editarBtn.addEventListener('click', updateUser);
    removerBtn.addEventListener('click', deleteUser);
    adicionarDepartamentoBtn.addEventListener('click', addDepartamento);
    departamentoModal._element.addEventListener('show.bs.modal', handleDepartmentModal);
    cadastrarModal._element.addEventListener('show.bs.modal', handleUserModal);

    
    validateInputs();
    

    if (localStorage.getItem('userToken')) {
        loginContainer.style.display = 'none';
        const userType = localStorage.getItem('userType');
        if(userType === 'admin') {
            dashboardContainer.style.display = 'block';
            fetchUsuarios();
        } else {
            dashboardContainerUser.style.display = 'block';
        }
        document.getElementById('navBar').querySelector('.navbar-brand').textContent = `Bem-vindo, ${localStorage.getItem('userName')}`;
    }
});