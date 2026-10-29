/**
 * @description Controlador JavaScript do Custom Select com Filtro de Pesquisa e suporte teclado
 * @version 1.1.0
 * @author Bsidenet.com
 * @date 2026-10-29
 */

document.addEventListener('DOMContentLoaded', () => {
    const customSelects = document.querySelectorAll('.custom-select');

    customSelects.forEach((selectContainer) => {
        const trigger = selectContainer.querySelector('.custom-select-trigger');
        const triggerName = trigger.querySelector('.item-name');
        const triggerRole = trigger.querySelector('.item-role');
        const optionsList = selectContainer.querySelector('.custom-select-options');
        const options = Array.from(selectContainer.querySelectorAll('.custom-option'));
        const emptyState = selectContainer.querySelector('.custom-option-empty');
        const hiddenInput = selectContainer.querySelector('input[type="hidden"]');
        const searchInput = selectContainer.querySelector('.custom-select-search-input');
        const debugOutput = document.getElementById('debug-valor');

        let focusedIndex = options.findIndex(opt => opt.classList.contains('is-selected'));

        /**
         * Alterna a abertura/fecho do menu dropdown
         */
        const toggleDropdown = () => {
            const isOpen = selectContainer.classList.contains('is-open');
            closeAllSelects();

            if (!isOpen) {
                selectContainer.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                
                // Reseta a pesquisa e foca o campo de pesquisa automaticamente
                if (searchInput) {
                    searchInput.value = '';
                    filterOptions('');
                    // Foca a caixa de pesquisa ao abrir para ser imediato escrever
                    setTimeout(() => searchInput.focus(), 50);
                } else {
                    optionsList.focus();
                }
            }
        };

        /**
         * Lógica de Filtro de Pesquisa (Nova Funcionalidade)
         */
        const filterOptions = (term) => {
            const normalizedTerm = term.toLowerCase().trim();
            let hasVisibleOptions = false;

            options.forEach(option => {
                const name = option.querySelector('.item-name').textContent.toLowerCase();
                const role = option.querySelector('.item-role').textContent.toLowerCase();
                
                // Pesquisa no nome OU no cargo
                if (name.includes(normalizedTerm) || role.includes(normalizedTerm)) {
                    option.style.display = 'flex';
                    hasVisibleOptions = true;
                } else {
                    option.style.display = 'none';
                    option.classList.remove('is-focused');
                }
            });

            // Mostra a mensagem de erro se não houver resultados
            if (emptyState) {
                emptyState.style.display = hasVisibleOptions ? 'none' : 'block';
            }
        };

        // Evento de digitação na caixa de pesquisa
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterOptions(e.target.value);
                // Reseta o foco do teclado para a primeira opção visível após pesquisar
                focusedIndex = -1; 
            });

            // Impede que clicar no campo de pesquisa feche o dropdown
            searchInput.addEventListener('click', (e) => e.stopPropagation());
        }

        /**
         * Seleciona uma opção e atualiza o estado
         */
        const selectOption = (optionElement) => {
            const value = optionElement.getAttribute('data-value');
            const nameText = optionElement.querySelector('.item-name').textContent;
            const roleText = optionElement.querySelector('.item-role').textContent;

            triggerName.textContent = nameText;
            triggerRole.textContent = roleText;

            if (hiddenInput) {
                hiddenInput.value = value;
                hiddenInput.dispatchEvent(new Event('change'));
            }

            if (debugOutput) {
                debugOutput.textContent = value + ` (${nameText})`;
            }

            options.forEach(opt => {
                opt.classList.remove('is-selected', 'is-focused');
                opt.setAttribute('aria-selected', 'false');
            });

            optionElement.classList.add('is-selected');
            optionElement.setAttribute('aria-selected', 'true');
            
            // Atualiza o índice focado considerando apenas os visíveis
            focusedIndex = getVisibleOptions().indexOf(optionElement);

            selectContainer.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        };

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleDropdown();
        });

        options.forEach((option) => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                selectOption(option);
            });
        });

        /**
         * Utilitário para obter apenas as opções que não foram filtradas pela pesquisa
         */
        const getVisibleOptions = () => options.filter(opt => opt.style.display !== 'none');

        // Navegação por teclado inteligente (considera pesquisa)
        selectContainer.addEventListener('keydown', (event) => {
            const isOpen = selectContainer.classList.contains('is-open');
            const visibleOptions = getVisibleOptions();

            if (event.key === 'Escape') {
                selectContainer.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
                trigger.focus();
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!isOpen) {
                    toggleDropdown();
                } else if (visibleOptions.length > 0) {
                    // Impede o foco de descer para a caixa de input, navega apenas nas <li>
                    const currentVisibleIndex = visibleOptions.findIndex(opt => opt.classList.contains('is-focused'));
                    const nextIndex = (currentVisibleIndex + 1) % visibleOptions.length;
                    updateFocusedOption(visibleOptions, nextIndex);
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!isOpen) {
                    toggleDropdown();
                } else if (visibleOptions.length > 0) {
                    const currentVisibleIndex = visibleOptions.findIndex(opt => opt.classList.contains('is-focused'));
                    const nextIndex = (currentVisibleIndex - 1 + visibleOptions.length) % visibleOptions.length;
                    updateFocusedOption(visibleOptions, nextIndex);
                }
            } else if (event.key === 'Enter') {
                if (isOpen) {
                    event.preventDefault(); // Impede submissão de formulários ao pesquisar
                    const currentFocused = visibleOptions.find(opt => opt.classList.contains('is-focused'));
                    if (currentFocused) {
                        selectOption(currentFocused);
                    } else if (visibleOptions.length === 1) {
                        // Se houver apenas 1 resultado após pesquisar, o Enter seleciona-o logo
                        selectOption(visibleOptions[0]);
                    }
                }
            }
        });
    });

    function updateFocusedOption(visibleOptions, index) {
        // Limpa o focus de TODAS as opções primeiro
        document.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('is-focused'));
        const target = visibleOptions[index];
        if (target) {
            target.classList.add('is-focused');
            target.scrollIntoView({ block: 'nearest' });
        }
    }

    function closeAllSelects() {
        document.querySelectorAll('.custom-select.is-open').forEach((openSelect) => {
            openSelect.classList.remove('is-open');
            const btn = openSelect.querySelector('.custom-select-trigger');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
    }

    document.addEventListener('click', closeAllSelects);
});
