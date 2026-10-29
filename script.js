/**
 * @description Controlador JavaScript para o componente Custom Select com suporte para rato e teclado
 * @version 1.0.0
 * @author Bsidenet.com
 * @date 2026-10-29
 */

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os componentes custom-select existentes na página
    const customSelects = document.querySelectorAll('.custom-select');

    customSelects.forEach((selectContainer) => {
        const trigger = selectContainer.querySelector('.custom-select-trigger');
        const triggerName = trigger.querySelector('.item-name');
        const triggerRole = trigger.querySelector('.item-role');
        const optionsList = selectContainer.querySelector('.custom-select-options');
        const options = Array.from(selectContainer.querySelectorAll('.custom-option'));
        const hiddenInput = selectContainer.querySelector('input[type="hidden"]');
        const debugOutput = document.getElementById('debug-valor');

        let focusedIndex = options.findIndex(opt => opt.classList.contains('is-selected'));

        /**
         * Alterna a abertura/fecho do menu dropdown
         */
        const toggleDropdown = () => {
            const isOpen = selectContainer.classList.contains('is-open');
            closeAllSelects(); // Fecha outros selects abertos na página, se existirem

            if (!isOpen) {
                selectContainer.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                optionsList.focus();
            }
        };

        /**
         * Seleciona uma opção específica e atualiza o botão e o input hidden
         * @param {HTMLElement} optionElement - O elemento <li> clicado ou escolhido
         */
        const selectOption = (optionElement) => {
            const value = optionElement.getAttribute('data-value');
            const nameText = optionElement.querySelector('.item-name').textContent;
            const roleText = optionElement.querySelector('.item-role').textContent;

            // 1. Atualiza o texto visível no botão principal
            triggerName.textContent = nameText;
            triggerRole.textContent = roleText;

            // 2. Atualiza o valor do input hidden (para submissão PHP/Form)
            if (hiddenInput) {
                hiddenInput.value = value;
                // Dispara evento 'change' caso tenhas outros scripts à escuta
                hiddenInput.dispatchEvent(new Event('change'));
            }

            // 3. Atualiza o indicador visual de demonstração
            if (debugOutput) {
                debugOutput.textContent = value + ` (${nameText})`;
            }

            // 4. Atualiza as classes e atributos de acessibilidade nas opções
            options.forEach(opt => {
                opt.classList.remove('is-selected', 'is-focused');
                opt.setAttribute('aria-selected', 'false');
            });

            optionElement.classList.add('is-selected');
            optionElement.setAttribute('aria-selected', 'true');
            focusedIndex = options.indexOf(optionElement);

            // 5. Fecha o dropdown e devolve o foco ao botão
            selectContainer.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        };

        // Evento de clique no botão principal
        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleDropdown();
        });

        // Evento de clique em cada opção da lista
        options.forEach((option) => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                selectOption(option);
            });
        });

        // Suporte para navegação por teclado (Setas Cima/Baixo, Enter e Escape)
        selectContainer.addEventListener('keydown', (event) => {
            const isOpen = selectContainer.classList.contains('is-open');

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
                } else {
                    focusedIndex = (focusedIndex + 1) % options.length;
                    updateFocusedOption(options, focusedIndex);
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!isOpen) {
                    toggleDropdown();
                } else {
                    focusedIndex = (focusedIndex - 1 + options.length) % options.length;
                    updateFocusedOption(options, focusedIndex);
                }
            } else if (event.key === 'Enter' || event.key === ' ') {
                if (isOpen && focusedIndex >= 0) {
                    event.preventDefault();
                    selectOption(options[focusedIndex]);
                }
            }
        });
    });

    /**
     * Auxiliar para destacar visualmente a opção ao navegar com as setas do teclado
     */
    function updateFocusedOption(options, index) {
        options.forEach(opt => opt.classList.remove('is-focused'));
        const target = options[index];
        if (target) {
            target.classList.add('is-focused');
            target.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Fecha todos os selects personalizados quando se clica fora deles
     */
    function closeAllSelects() {
        document.querySelectorAll('.custom-select.is-open').forEach((openSelect) => {
            openSelect.classList.remove('is-open');
            const btn = openSelect.querySelector('.custom-select-trigger');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
    }

    // Fecha o menu se o utilizador clicar em qualquer zona fora do componente
    document.addEventListener('click', closeAllSelects);
});
