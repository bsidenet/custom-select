/**
 * @description Controlador JavaScript do Custom Select (Pesquisa Dinâmica + Debounce + Highlight)
 * @version 1.2.0
 * @author Bsidenet.com
 * @date 2026-10-30
 */

document.addEventListener('DOMContentLoaded', () => {
    const customSelects = document.querySelectorAll('.custom-select');

    // Utilitário para escapar caracteres especiais em expressões regulares
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Utilitário Debounce para não saturar a pesquisa (ideal para futuras chamadas API)
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

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

        const toggleDropdown = () => {
            const isOpen = selectContainer.classList.contains('is-open');
            closeAllSelects();

            if (!isOpen) {
                selectContainer.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                
                if (searchInput) {
                    searchInput.value = '';
                    filterOptions(''); // Reseta a vista
                    setTimeout(() => searchInput.focus(), 50);
                } else {
                    optionsList.focus();
                }
            }
        };

        /**
         * Aplica a marcação HTML (<mark>) aos termos encontrados
         */
        const highlightText = (element, originalText, term) => {
            if (!term) {
                element.textContent = originalText;
                return;
            }
            const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
            element.innerHTML = originalText.replace(regex, '<mark class="highlight">$1</mark>');
        };

        /**
         * Lógica Central da Pesquisa Dinâmica
         */
        const filterOptions = (term) => {
            const normalizedTerm = term.toLowerCase().trim();
            let hasVisibleOptions = false;

            options.forEach(option => {
                const nameEl = option.querySelector('.item-name');
                const roleEl = option.querySelector('.item-role');
                
                // Armazena o texto original em cache na primeira passagem
                if (!nameEl.hasAttribute('data-original')) {
                    nameEl.setAttribute('data-original', nameEl.textContent.trim());
                }
                if (!roleEl.hasAttribute('data-original')) {
                    roleEl.setAttribute('data-original', roleEl.textContent.trim());
                }

                const nameText = nameEl.getAttribute('data-original');
                const roleText = roleEl.getAttribute('data-original');
                
                const matchesName = nameText.toLowerCase().includes(normalizedTerm);
                const matchesRole = roleText.toLowerCase().includes(normalizedTerm);

                if (matchesName || matchesRole) {
                    option.style.display = 'flex';
                    hasVisibleOptions = true;
                    // Aplica o highlight visual ao que bateu certo
                    highlightText(nameEl, nameText, normalizedTerm);
                    highlightText(roleEl, roleText, normalizedTerm);
                } else {
                    option.style.display = 'none';
                    option.classList.remove('is-focused');
                    // Limpa highlights invisíveis
                    highlightText(nameEl, nameText, "");
                    highlightText(roleEl, roleText, "");
                }
            });

            if (emptyState) {
                emptyState.style.display = hasVisibleOptions ? 'none' : 'block';
            }
        };

        // Aplica o evento com Debounce (250ms de espera após o utilizador parar de escrever)
        if (searchInput) {
            const debouncedSearch = debounce((e) => {
                filterOptions(e.target.value);
                focusedIndex = -1; // Reseta o foco do teclado
            }, 250);

            searchInput.addEventListener('input', debouncedSearch);
            searchInput.addEventListener('click', (e) => e.stopPropagation());
        }

        const selectOption = (optionElement) => {
            const value = optionElement.getAttribute('data-value');
            // Vai buscar sempre ao data-original para evitar puxar a tag <mark> para o título
            const nameEl = optionElement.querySelector('.item-name');
            const roleEl = optionElement.querySelector('.item-role');
            const nameText = nameEl.getAttribute('data-original') || nameEl.textContent;
            const roleText = roleEl.getAttribute('data-original') || roleEl.textContent;

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

        const getVisibleOptions = () => options.filter(opt => opt.style.display !== 'none');

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
                    event.preventDefault();
                    const currentFocused = visibleOptions.find(opt => opt.classList.contains('is-focused'));
                    if (currentFocused) {
                        selectOption(currentFocused);
                    } else if (visibleOptions.length === 1) {
                        selectOption(visibleOptions[0]);
                    }
                }
            }
        });
    });

    function updateFocusedOption(visibleOptions, index) {
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
