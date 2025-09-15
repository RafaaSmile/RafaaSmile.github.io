// IIFE para encapsular o código e evitar poluir o escopo global
(function () {
  'use strict';
  
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Inicia o header dinâmico que muda com o scroll.
   */
  function initHeaderScroll() {
    const header = $('.site-header');
    if (!header) return;

    const handleScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /**
   * Controla a barra de progresso global no topo da página.
   */
  function initGlobalProgressBar() {
    const globalProgress = $('#globalProgress');
    if (!globalProgress) return;
    
    const setProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      globalProgress.style.width = `${progress}%`;
    };

    window.addEventListener('scroll', setProgress, { passive: true });
    setProgress();
  }

  /**
   * Efeito parallax para elementos no hero.
   */
  function initParallax() {
    if (reducedMotion) return;
    
    const parallaxEls = $$('.parallax');
    if (parallaxEls.length === 0) return;
    
    const parallaxLoop = () => {
      const y = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax || '0');
        el.style.transform = `translate3d(0, ${y * speed / 100}px, 0)`;
      });
      requestAnimationFrame(parallaxLoop);
    };
    requestAnimationFrame(parallaxLoop);
  }

  /**
   * Revela elementos na tela conforme o usuário rola a página.
   */
  function initRevealOnScroll() {
    const revealEls = $$('.reveal');
    if (revealEls.length === 0 || reducedMotion) {
        revealEls.forEach(el => el.classList.add('is-visible'));
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(el => observer.observe(el));
  }

  /**
   * Funcionalidade para o slider de comparação "Antes e Depois".
   */
  function initBeforeAfterSlider() {
    const slider = $('.ba-slider');
    if (!slider) return;

    const afterImg = $('.ba-after');
    const container = $('.ba-media');

    const updateClip = (value) => {
        const clipValue = Math.max(0, Math.min(100, 100 - value));
        afterImg.style.clipPath = `inset(0 ${clipValue}% 0 0)`;
    };
    
    slider.addEventListener('input', () => updateClip(slider.value), { passive: true });

    // Suporte para arrastar no desktop
    let isDragging = false;
    const startDrag = (e) => {
        isDragging = true;
        container.classList.add('is-dragging');
    };
    const stopDrag = () => {
        isDragging = false;
        container.classList.remove('is-dragging');
    };
    const drag = (e) => {
        if (!isDragging) return;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        slider.value = percentage;
        updateClip(percentage);
    };

    container.addEventListener('mousedown', startDrag);
    container.addEventListener('touchstart', startDrag, { passive: true });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: true });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }

  /**
   * Inicializa o carrossel Swiper para os projetos.
   */
  function initSwiperCarousel() {
    if (typeof Swiper === 'undefined') {
      console.warn('Swiper não está carregado');
      return;
    }

    new Swiper('.swiper', {
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      keyboard: {
        enabled: true,
      },
      a11y: {
        prevSlideMessage: 'Slide anterior',
        nextSlideMessage: 'Próximo slide',
        firstSlideMessage: 'Este é o primeiro slide',
        lastSlideMessage: 'Este é o último slide',
      },
    });
  }

  /**
   * Efeito magnético nos botões.
   */
  function initMagneticButtons() {
    if (reducedMotion) return;
    
    const magneticBtns = $$('.btn-magnetic');
    
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        btn.style.setProperty('--mx', `${x}%`);
        btn.style.setProperty('--my', `${y}%`);
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mx', '50%');
        btn.style.setProperty('--my', '50%');
      });
    });
  }

  /**
   * Modal para visualizar projetos em detalhes.
   */
  function initProjectModal() {
    const modal = $('#projectModal');
    const closeModalBtn = $('#closeModalBtn');
    const projectCards = $$('.project-card');
    
    if (!modal || !closeModalBtn) return;

    let firstFocusable, lastFocusable;

    function openModal(card) {
        const title = card.dataset.title;
        const desc = card.dataset.desc;
        const tags = JSON.parse(card.dataset.tags || '[]');
        const images = JSON.parse(card.dataset.images || '[]');

        $('#modalTitle').textContent = title;
        $('#modalDesc').textContent = desc;

        const modalTags = $('#modalTags');
        modalTags.innerHTML = '';
        tags.forEach(tag => {
            const li = document.createElement('li');
            li.textContent = tag;
            modalTags.appendChild(li);
        });

        if (images.length > 0) {
            $('#modalMainImage').src = images[0];
            
            const thumbnailsContainer = $('#modalThumbnails');
            thumbnailsContainer.innerHTML = '';
            
            if (images.length > 1) {
                images.forEach((img, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = img;
                    thumb.alt = `Imagem ${index + 1} do projeto ${title}`;
                    thumb.className = `modal-thumb ${index === 0 ? 'active' : ''}`;
                    thumb.dataset.index = index;
                    thumbnailsContainer.appendChild(thumb);
                });
            }
        }

        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        setTimeout(() => {
            modal.classList.add('is-open');
        }, 10);

        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusable = focusableElements[0];
        lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 350);
    }

    function handleKeyDown(e) {
        if (!modal.classList.contains('is-open')) return;

        if (e.key === 'Escape') {
            closeModal();
        }

        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    }
    
    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(card);
        });
    });
    
    $('#modalThumbnails').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-thumb')) {
            const card = e.target.closest('.modal-inner');
            const images = JSON.parse($(`.project-card[data-title="${$('#modalTitle').textContent}"]`).dataset.images);
            const index = parseInt(e.target.dataset.index, 10);

            $('#modalMainImage').src = images[index];
            $$('.modal-thumb', card).forEach(thumb => thumb.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', handleKeyDown);
  }


  // Executa todas as funções de inicialização quando o DOM estiver pronto.
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initGlobalProgressBar();
    initParallax();
    initRevealOnScroll();
    initBeforeAfterSlider();
    initSwiperCarousel();
    initProjectModal();
    initMagneticButtons();
  });

})();

