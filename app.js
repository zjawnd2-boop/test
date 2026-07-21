// JointJS Table Layout Editor
document.addEventListener('DOMContentLoaded', () => {
  // 가상 비영업일 데이터 상태 변수
  let nonOperatingDays = [];

  // DB 연동 시뮬레이션용 비영업일 fetch 함수
  function fetchNonOperatingDays() {
    return new Promise((resolve) => {
      // 50ms 대기 후 테스트 데이터 반환 (비동기 DB 조회 모사)
      setTimeout(() => {
        resolve(["2026-07-07", "2026-07-08", "2026-07-11"]);
      }, 50);
    });
  }

  // FullCalendar v5 (구버전) 초기화
  let oldCalendarInstance = null;

  function initOldCalendar() {
    const calendarEl = document.getElementById('calendar-old');
    oldCalendarInstance = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next'
      },
      height: 'auto',
      dateClick: function(info) {
        // 날짜 선택 시 인풋 텍스트 지정 후 팝업 닫기
        document.getElementById('old-datepicker-input').value = info.dateStr;
        document.getElementById('calendar-old-wrapper').style.display = 'none';
      },
      dayCellDidMount: function(info) {
        const day = info.date.getDay(); // 0: 일요일, 6: 토요일
        const numberEl = info.el.querySelector('.fc-daygrid-day-number');

        // 일요일 색상 처리
        if (day === 0 && numberEl) {
          numberEl.style.setProperty('color', '#f87171', 'important');
        }
        // 토요일 색상 처리
        else if (day === 6 && numberEl) {
          numberEl.style.setProperty('color', '#38bdf8', 'important');
        }

        // 비영업일 체크 및 강조 표시
        const year = info.date.getFullYear();
        const month = String(info.date.getMonth() + 1).padStart(2, '0');
        const date = String(info.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${date}`;

        if (nonOperatingDays.includes(dateStr)) {
          info.el.style.setProperty('background-color', 'rgba(239, 68, 68, 0.15)', 'important');
          
          if (!info.el.querySelector('.fc-holiday-label')) {
            const label = document.createElement('div');
            label.className = 'fc-holiday-label';
            label.textContent = '비영업';
            label.style.fontSize = '8px';
            label.style.color = '#ef4444';
            label.style.textAlign = 'center';
            label.style.fontWeight = 'bold';
            label.style.marginTop = '2px';
            
            const frame = info.el.querySelector('.fc-daygrid-day-frame');
            if (frame) {
              frame.appendChild(label);
            }
          }
        }
      }
    });
    oldCalendarInstance.render();
  }

  // 초기화 시 비영업일 로드 및 달력 반영
  fetchNonOperatingDays().then((days) => {
    nonOperatingDays = days;
    applyCustomDateStyles(); // 데이터 로드 완료 후 달력 스타일 즉시 갱신
    initOldCalendar(); // FullCalendar v5 초기화
    
    // 구버전 달력 인풋 기본값 세팅 (오늘 날짜 yyyy-MM-dd)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const oldInput = document.getElementById('old-datepicker-input');
    if (oldInput) {
      oldInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // 인풋 필드 클릭 시 팝업 열기/닫기 토글
    const oldInputGroup = document.getElementById('old-datepicker-input-group');
    const oldCalWrapper = document.getElementById('calendar-old-wrapper');

    if (oldInputGroup && oldCalWrapper) {
      oldInputGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = oldCalWrapper.style.display === 'none' || oldCalWrapper.style.display === '';
        oldCalWrapper.style.display = isHidden ? 'block' : 'none';
        
        // 캘린더가 켜질 때 FullCalendar의 크기를 재조정(updateSize)해야 깨지지 않음
        if (isHidden && oldCalendarInstance) {
          oldCalendarInstance.updateSize();
        }
      });

      // 팝업 내부 클릭 시 이벤트 버블링 차단
      oldCalWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // 달력 바깥 클릭 시 닫기
      document.addEventListener('click', () => {
        oldCalWrapper.style.display = 'none';
      });
    }
  });

  // TOAST UI DatePicker 초기화
  const datepicker = new tui.DatePicker('#datepicker-wrapper', {
    date: new Date(), // 현재 일자 기본값 지정
    input: {
      element: '#datepicker-input',
      format: 'yyyy-MM-dd'
    },
    showAlways: false
  });

  // 캘린더가 갱신되거나 열릴 때 주말 및 비영업일(2026-07-07) 하이라이트 부여
  function applyCustomDateStyles() {
    setTimeout(() => {
      const titleEl = document.querySelector('#datepicker-wrapper .tui-calendar-title');
      const titleText = titleEl ? titleEl.textContent : '';

      // July 2026, 2026.07, 2026년 7월 등의 문자열 매칭으로 현재 연도와 월 추출
      let year = 2026;
      let month = 7; // 1 ~ 12

      // 타이틀 텍스트에서 숫자 두 개(연도, 월)를 파싱하는 정규식 시도
      const numbers = titleText.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        year = parseInt(numbers[0], 10);
        month = parseInt(numbers[1], 10);
      } else if (numbers && numbers.length === 1) {
        // 영문식 "July 2026" 대응
        year = parseInt(numbers[0], 10);
        const lowerTitle = titleText.toLowerCase();
        if (lowerTitle.includes('jan')) month = 1;
        else if (lowerTitle.includes('feb')) month = 2;
        else if (lowerTitle.includes('mar')) month = 3;
        else if (lowerTitle.includes('apr')) month = 4;
        else if (lowerTitle.includes('may')) month = 5;
        else if (lowerTitle.includes('jun')) month = 6;
        else if (lowerTitle.includes('jul')) month = 7;
        else if (lowerTitle.includes('aug')) month = 8;
        else if (lowerTitle.includes('sep')) month = 9;
        else if (lowerTitle.includes('oct')) month = 10;
        else if (lowerTitle.includes('nov')) month = 11;
        else if (lowerTitle.includes('dec')) month = 12;
      }

      const dateCells = document.querySelectorAll('#datepicker-wrapper .tui-calendar-date');
      dateCells.forEach(cell => {
        const dayText = cell.textContent.trim();
        const dayNum = parseInt(dayText, 10);

        if (isNaN(dayNum)) return;

        // 이전/다음 달에 해당하는 셀은 제외하고 현재 월 셀만 처리
        const isCurrentMonth = !cell.classList.contains('tui-calendar-prev-month') &&
          !cell.classList.contains('tui-calendar-next-month');

        // 현재 월인 경우에만 비영업일 판별
        if (isCurrentMonth) {
          // 비영업일 매칭 및 클래스 추가 (DB 로드 결과인 nonOperatingDays 배열 검사)
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          if (nonOperatingDays.includes(dateStr)) {
            cell.classList.add('non-operating-day');
            cell.style.setProperty('color', '#f87171', 'important');
            cell.style.setProperty('background-color', 'rgba(239, 68, 68, 0.15)', 'important');
            cell.style.setProperty('font-weight', 'bold', 'important');

            if (!cell.querySelector('.holiday-label')) {
              const holidayLabel = document.createElement('span');
              holidayLabel.className = 'holiday-label';
              holidayLabel.textContent = '비영업';
              holidayLabel.style.position = 'absolute';
              holidayLabel.style.bottom = '1px';
              holidayLabel.style.left = '50%';
              holidayLabel.style.transform = 'translateX(-50%) scale(0.65)';
              holidayLabel.style.fontSize = '8px';
              holidayLabel.style.color = '#ef4444';
              holidayLabel.style.whiteSpace = 'nowrap';
              holidayLabel.style.fontWeight = 'bold';
              cell.appendChild(holidayLabel);
            }
          }
        }
      });
    }, 10);
  }

  // datepicker 이벤트 리스너 등록
  datepicker.on('draw', applyCustomDateStyles);
  datepicker.on('open', applyCustomDateStyles);
  applyCustomDateStyles();

  // 뎁스 2 이상 깊게 중첩된 하위 요소 검사 함수 (최상위 그룹화 바로 하위 자식까지만 조작 허용)
  function isDeeplyNested(cell) {
    if (!cell) return false;
    const p1 = cell.getParentCell();
    if (!p1) return false; // depth 0 (최상위 요소)
    const p2 = p1.getParentCell();
    if (!p2) return false; // depth 1 (최상위 그룹의 바로 하위 자식)
    return true; // depth >= 2 (최상위 그룹의 손자 이하 하위 요소)
  }

  // 1. Graph 및 Paper 초기화
  const graph = new joint.dia.Graph();
  const paperContainer = document.getElementById('paper-container');

  const paper = new joint.dia.Paper({
    el: paperContainer,
    model: graph,
    width: 800,
    height: 600,
    gridSize: 10,
    drawGrid: {
      name: 'mesh',
      args: { color: 'rgba(255, 255, 255, 0.05)', thickness: 1 }
    },
    background: {
      color: '#0d1321'
    },
    interactive: function(cellView) {
      // 뎁스 2 이상 깊게 중첩된 하위 요소는 드래그 등 모든 개별 인터랙션 비활성화
      if (cellView.model && isDeeplyNested(cellView.model)) {
        return false;
      }
      return true;
    },
    sortElements: true // Z-Index 값에 따라 자동으로 SVG DOM 요소를 정렬하도록 활성화
  });

  // 전역 상태 및 다중 선택 상태 변수들 (Temporal Dead Zone 방지)
  let selectedElement = null;
  let overlayEl = null;
  let selectedElements = [];
  let isMultiDragging = false;
  let selectionToolbar = null;
  let shapeCounter = 1;
  let groupCounter = 1;

  // 실행 취소/재실행 (Undo/Redo) 히스토리 스택
  let undoStack = [];
  let redoStack = [];
  let isUndoRedoAction = false;

  // 캔버스 줌 배율 상태 변수 (기본 1.0 = 100%)
  let currentZoom = 1.0;

  // 브라우저 크기 조절 및 도형 위치에 따라 Paper 크기 자동 조정
  function resizePaper() {
    const viewport = paperContainer.parentElement;
    const containerWidth = viewport ? (viewport.clientWidth || 800) : 800;
    const containerHeight = viewport ? (viewport.clientHeight || 600) : 600;

    let maxX = 0;
    let maxY = 0;

    // 그래프 내 모든 요소의 우측 하단 끝 좌표 계산
    graph.getElements().forEach((el) => {
      const position = el.position();
      const size = el.size();
      if (position && size) {
        const right = position.x + size.width;
        const bottom = position.y + size.height;
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      }
    });

    // 약간의 마진(여유 영역)을 두어 스크롤 시 뻑뻑하지 않게 함
    const margin = 100;
    
    // [줌 대응 물리/논리 분리 공식]
    // 1. 실제 화면(뷰포트) 스크롤 영역을 결정할 물리적 픽셀 크기 계산
    // 줌 배율만큼 컨테이너 최소 너비/높이를 팽창시키거나, 도형의 줌 배율이 곱해진 좌표값을 취함
    const physicalWidth = Math.max(containerWidth, containerWidth * currentZoom, (maxX + margin) * currentZoom);
    const physicalHeight = Math.max(containerHeight, containerHeight * currentZoom, (maxY + margin) * currentZoom);

    // 2. JointJS Paper에 설정할 배율 1.0 기준의 논리적 도판 좌표계 크기 역산
    const logicalWidth = physicalWidth / currentZoom;
    const logicalHeight = physicalHeight / currentZoom;

    // 3. JointJS Paper의 드로잉 논리 크기 세팅 (내부 그래픽 잘림 완벽 차단)
    paper.setDimensions(logicalWidth, logicalHeight);

    // 4. 실제 DOM 컨테이너의 물리적 크기 할당 (뷰포트 부모가 스크롤바를 100% 인지하고 띄우게 만듦)
    paperContainer.style.width = `${physicalWidth}px`;
    paperContainer.style.height = `${physicalHeight}px`;

    // 하단 툴바 정보 실시간 업데이트 (100% 기준의 논리적 레이아웃 크기로 표시)
    const sizeDisplay = document.getElementById('canvas-size-display');
    if (sizeDisplay) {
      sizeDisplay.textContent = `가로: ${Math.round(logicalWidth)}px / 세로: ${Math.round(logicalHeight)}px`;
    }
    const zoomDisplay = document.getElementById('zoom-level-display');
    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    // 선택된 도형 조절 가이드 박스 및 그룹 툴바 위치 실시간 보정
    if (typeof updateOverlayPosition === 'function') {
      updateOverlayPosition();
    }
    if (typeof updateSelectionToolbar === 'function') {
      updateSelectionToolbar();
    }
  }
  window.addEventListener('resize', resizePaper);
  
  // 도형 추가, 삭제, 속성(위치/크기/각도) 변화 시 캔버스 영역 실시간 재연산
  graph.on('add remove change:position change:size change:angle', resizePaper);

  // 100% 기준의 현재 캔버스 상태(JSON 스냅샷)를 획득하는 함수
  function getLayoutSnapshot() {
    const shapes = graph.getElements().map(cell => {
      if (cell.isLink()) return null;
      return {
        id: cell.id,
        type: cell.get('type'),
        tableType: cell.get('tableType'),
        tableName: cell.get('tableName'),
        capacity: cell.get('capacity'),
        position: cell.position(),
        size: cell.size(),
        angle: cell.angle(),
        z: cell.get('z') || 0,
        note1: cell.get('note1') || '',
        note2: cell.get('note2') || '',
        note3: cell.get('note3') || '',
        parent: cell.getParentCell() ? cell.getParentCell().id : null
      };
    }).filter(Boolean);

    return {
      zoom: currentZoom,
      shapes: shapes
    };
  }

  // 히스토리에 현재 스냅샷 누적 저장
  function pushState() {
    if (isUndoRedoAction) return;
    const snapshot = JSON.stringify(getLayoutSnapshot());
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === snapshot) {
      return;
    }
    if (undoStack.length >= 50) {
      undoStack.shift();
    }
    undoStack.push(snapshot);
    redoStack = []; // 사용자 신규 조작 시 Redo 초기화
  }

  // 히스토리 전체 초기화 (최초 기동 및 레이아웃 Load 시점)
  function resetHistory() {
    undoStack = [JSON.stringify(getLayoutSnapshot())];
    redoStack = [];
  }

  // 히스토리 데이터 복원 함수
  function restoreState(snapshotStr) {
    if (!snapshotStr) return;
    isUndoRedoAction = true;

    // 1단계: 기존 모든 도형 제거
    graph.clear();
    removeTransformOverlay();
    clearMultiSelection();

    const snapshot = JSON.parse(snapshotStr);

    // 줌 배율 복원
    if (snapshot.zoom) {
      currentZoom = snapshot.zoom;
      paper.scale(currentZoom, currentZoom);
    }

    const shapes = snapshot.shapes || [];
    const idMap = {};
    let maxCounter = 0;

    // 2단계: 도형 복원 생성
    shapes.forEach(shapeData => {
      let shape = null;
      const x = shapeData.position.x;
      const y = shapeData.position.y;

      if (shapeData.tableType === 'Rectangle') {
        shape = createRectangle(x, y);
      } else if (shapeData.tableType === 'Ellipse') {
        shape = createCircle(x, y);
      } else if (shapeData.tableType === 'Triangle') {
        shape = createTriangle(x, y);
      } else if (shapeData.tableType === 'Diamond') {
        shape = createDiamond(x, y);
      } else if (shapeData.tableType === 'Group') {
        shape = createGroup(x, y, shapeData.size.width, shapeData.size.height, shapeData.tableName);
      }

      if (shape) {
        shape.resize(shapeData.size.width, shapeData.size.height);
        shape.rotate(shapeData.angle || 0, true);
        shape.set('z', shapeData.z || 0);
        shape.set('tableName', shapeData.tableName);
        shape.attr('label/text', shapeData.tableName);
        shape.set('capacity', shapeData.capacity);
        shape.set('note1', shapeData.note1 || '');
        shape.set('note2', shapeData.note2 || '');
        shape.set('note3', shapeData.note3 || '');
        idMap[shapeData.id] = shape;

        // 카운터 넘버링 복원
        const numPart = shapeData.tableName.match(/\d+/);
        if (numPart) {
          const num = parseInt(numPart[0], 10);
          if (num > maxCounter) maxCounter = num;
        }
      }
    });

    // 3단계: 부모-자식 그룹 관계 복원
    shapes.forEach(shapeData => {
      if (shapeData.parent && idMap[shapeData.parent] && idMap[shapeData.id]) {
        idMap[shapeData.parent].embed(idMap[shapeData.id]);
      }
    });

    // 4단계: Z-Index 정규화
    const allEls = graph.getElements();
    if (allEls.length > 0) {
      bringToFrontAndNormalize(allEls[0]);
    }

    shapeCounter = maxCounter + 1;
    resizePaper();
    isUndoRedoAction = false;
  }

  // 실행 취소 (Undo) 실행
  function undo() {
    if (undoStack.length > 1) {
      const currentState = undoStack.pop();
      redoStack.push(currentState);
      const prevState = undoStack[undoStack.length - 1];
      restoreState(prevState);
    }
  }

  // 재실행 (Redo) 실행
  function redo() {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      undoStack.push(nextState);
      restoreState(nextState);
    }
  }

  // 도형 추가 및 삭제 시점 스냅샷 저장
  graph.on('add remove', (cell) => {
    if (cell && !cell.isLink()) {
      pushState();
    }
  });

  // 드래그 완료 시점 스냅샷 저장 및 그룹 영역 갱신
  paper.on('cell:pointerup', () => {
    // 모든 그룹 도형들에 대해 하위 자식 크기에 맞춤 처리 진행
    const groups = graph.getCells().filter(cell => cell.get('tableType') === 'Group');
    groups.forEach(group => {
      fitGroupToChildren(group);
    });
    pushState();
  });

  resizePaper(); // 즉시 호출
  setTimeout(resizePaper, 100);
  resetHistory(); // 최초 로딩 히스토리 리셋 (되돌리기 불가 기준점 확보)

  // ───────────────────────────────────────────────────────────
  // SVG 패턴 주입: 사각형 도형 내부에만 테이블 이미지 배경 노출
  // patternUnits="objectBoundingBox" → 패턴이 각 도형의 경계 안에만 렌더링됨
  // ───────────────────────────────────────────────────────────
  (function injectTableBgPattern() {
    const svgEl = paper.svg;
    let defs = svgEl.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgEl.insertBefore(defs, svgEl.firstChild);
    }
    // 기존에 이미 주입된 경우 중복 삽입 방지
    if (defs.querySelector('#table-bg-pattern')) return;

    const NS = 'http://www.w3.org/2000/svg';
    const pattern = document.createElementNS(NS, 'pattern');
    pattern.setAttribute('id', 'table-bg-pattern');
    // objectBoundingBox: 좌표계가 도형 경계(0~1) 기준으로 설정됨
    pattern.setAttribute('patternUnits', 'objectBoundingBox');
    // patternContentUnits도 objectBoundingBox로 설정해야
    // <image width="1" height="1"> 이 "도형 전체 크기"로 해석됨
    pattern.setAttribute('patternContentUnits', 'objectBoundingBox');
    pattern.setAttribute('width', '1');
    pattern.setAttribute('height', '1');

    const img = document.createElementNS(NS, 'image');
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', './table-illust-bg.png');
    img.setAttribute('href', './table-illust-bg.png'); // 현대 브라우저 호환
    img.setAttribute('x', '0');
    img.setAttribute('y', '0');
    // objectBoundingBox 좌표계에서 width/height=1 → 도형 전체 맞춤
    img.setAttribute('width', '1');
    img.setAttribute('height', '1');
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');

    pattern.appendChild(img);
    defs.appendChild(pattern);
  })();

  // 도형 외곽선 강조 토글 함수
  function highlightElement(el, highlight) {
    const body = el.attr('body');
    if (!body) return;
    
    if (highlight) {
      if (!el.get('originalStroke')) {
        el.set('originalStroke', body.stroke || '#06b6d4');
        el.set('originalStrokeWidth', body.strokeWidth || 2);
        el.set('originalStrokeDasharray', body.strokeDasharray || 'none');
      }
      el.attr('body/stroke', '#f59e0b'); // amber 색상
      el.attr('body/strokeWidth', 3);
      el.attr('body/strokeDasharray', '5 3'); // 점선 스타일
    } else {
      const origStroke = el.get('originalStroke');
      const origWidth = el.get('originalStrokeWidth');
      const origDash = el.get('originalStrokeDasharray');
      if (origStroke !== undefined) {
        el.attr('body/stroke', origStroke);
        el.attr('body/strokeWidth', origWidth);
        el.attr('body/strokeDasharray', origDash);
        el.unset('originalStroke');
        el.unset('originalStrokeWidth');
        el.unset('originalStrokeDasharray');
      }
    }
  }

  // 다중 선택 해제 함수
  function clearMultiSelection() {
    selectedElements.forEach(el => highlightElement(el, false));
    selectedElements = [];
    if (typeof updateSelectionToolbar === 'function') {
      updateSelectionToolbar();
    }
  }

  // 그룹 승격 검사 함수 (그룹 내 모든 자식이 선택되었거나 부모가 직접 선택되었을 때 최상위 그룹 선택으로 대체)
  function resolveGroupSelection() {
    let changed = false;
    const groups = graph.getCells().filter(cell => cell.get('tableType') === 'Group');
    
    do {
      changed = false;
      for (const group of groups) {
        const children = group.getEmbeddedCells().filter(c => !c.isLink());
        if (children.length === 0) continue;
        
        const isParentSelected = selectedElements.includes(group);
        const allChildrenSelected = children.every(child => selectedElements.includes(child));
        
        if (isParentSelected || allChildrenSelected) {
          // 자식들을 선택 해제
          children.forEach(child => {
            const idx = selectedElements.indexOf(child);
            if (idx > -1) {
              selectedElements.splice(idx, 1);
              highlightElement(child, false);
              changed = true;
            }
          });
          // 부모 그룹을 선택 리스트에 추가
          if (!selectedElements.includes(group)) {
            selectedElements.push(group);
            highlightElement(group, true);
            changed = true;
          }
        }
      }
    } while (changed);
  }

  // 선택 플로팅 툴바 생성 및 DOM 추가
  selectionToolbar = document.createElement('div');
  selectionToolbar.id = 'selection-toolbar';
  selectionToolbar.className = 'selection-toolbar';
  selectionToolbar.innerHTML = `
    <button id="btn-selection-group" class="btn btn-purple" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);">🔗 그룹화</button>
    <button id="btn-selection-delete" class="btn btn-red" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; box-shadow: 0 4px 68px rgba(239, 68, 68, 0.4); margin-left: 0.5rem;">🗑️ 삭제</button>
  `;
  paperContainer.appendChild(selectionToolbar);

  // 플로팅 툴바 위치 갱신 함수
  function updateSelectionToolbar() {
    if (!selectionToolbar) return;
    if (selectedElements.length >= 2) {
      // 선택된 모든 엘리먼트들을 감싸는 바운딩 박스 계산
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selectedElements.forEach(el => {
        const pos = el.position();
        const size = el.size();
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + size.width);
        maxY = Math.max(maxY, pos.y + size.height);
      });
      
      const toolbarX = minX + (maxX - minX) / 2 - 40; // 중앙 정렬
      const toolbarY = minY - 45; // 도형들 상단에 배치
      
      selectionToolbar.style.left = `${Math.max(10, toolbarX * currentZoom)}px`;
      selectionToolbar.style.top = `${Math.max(10, toolbarY * currentZoom)}px`;
      selectionToolbar.style.display = 'flex';

      // 이미 다른 그룹의 자식으로 포함되어 있는 도형이 있을 때만 그룹화 버튼을 노출하지 않음
      // (즉, 탑레벨 도형이나 이미 그룹인 도형 자체는 다중 선택 시 다시 그룹화 가능)
      const hasNestedChildElement = selectedElements.some(el => el.getParentCell() !== null);
      const btnGroup = selectionToolbar.querySelector('#btn-selection-group');
      if (btnGroup) {
        btnGroup.style.display = hasNestedChildElement ? 'none' : '';
      }
    } else {
      selectionToolbar.style.display = 'none';
    }
  }

  // 모달 DOM 엘리먼트 취득
  const detailModal = document.getElementById('detail-modal');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalApply = document.getElementById('btn-modal-apply');

  const inputName = document.getElementById('input-table-name');
  const inputCapacity = document.getElementById('input-capacity');
  const inputX = document.getElementById('input-x');
  const inputY = document.getElementById('input-y');
  const inputWidth = document.getElementById('input-width');
  const inputHeight = document.getElementById('input-height');
  const inputAngle = document.getElementById('input-angle');
  const inputNote1 = document.getElementById('input-note1');
  const inputNote2 = document.getElementById('input-note2');
  const inputNote3 = document.getElementById('input-note3');
  const inputZIndex = document.getElementById('input-zindex');

  // 2. 모달 제어 함수
  function openDetailModal(element) {
    selectedElement = element;

    // 현재 도형 속성 정보 로드
    const pos = element.position();
    const size = element.size();
    const angle = element.angle();
    const zIndex = element.get('z') || 0;
    const tableName = element.get('tableName') || '';
    const capacity = element.get('capacity') || '';
    const note1 = element.get('note1') || '';
    const note2 = element.get('note2') || '';
    const note3 = element.get('note3') || '';

    // 모달 입력창 채우기
    inputName.value = tableName;
    inputCapacity.value = capacity;
    inputX.value = Math.round(pos.x);
    inputY.value = Math.round(pos.y);
    inputWidth.value = Math.round(size.width);
    inputHeight.value = Math.round(size.height);
    inputAngle.value = angle;
    inputZIndex.value = zIndex;
    inputNote1.value = note1;
    inputNote2.value = note2;
    inputNote3.value = note3;

    // 모달 팝업 표시
    detailModal.style.display = 'flex';

    // 적용 버튼 이벤트 바인딩 (이전 리스너 덮어쓰기)
    btnModalApply.onclick = () => {
      const newName = inputName.value.trim();
      const newCapacity = parseInt(inputCapacity.value, 10);
      const newX = parseInt(inputX.value, 10);
      const newY = parseInt(inputY.value, 10);
      const newWidth = parseInt(inputWidth.value, 10);
      const newHeight = parseInt(inputHeight.value, 10);
      const newAngle = parseInt(inputAngle.value, 10);
      const newZIndex = parseInt(inputZIndex.value, 10);
      const newNote1 = inputNote1.value.trim();
      const newNote2 = inputNote2.value.trim();
      const newNote3 = inputNote3.value.trim();

      // 유효성 검사
      if (!newName) {
        alert('테이블명을 입력해 주세요.');
        return;
      }
      if (isNaN(newCapacity) || newCapacity < 1) {
        alert('수용 인원수는 1명 이상이어야 합니다.');
        return;
      }
      if (isNaN(newX) || isNaN(newY)) {
        alert('좌표는 숫자만 입력 가능합니다.');
        return;
      }
      if (isNaN(newWidth) || newWidth < 10 || isNaN(newHeight) || newHeight < 10) {
        alert('크기는 10px 이상이어야 합니다.');
        return;
      }
      if (isNaN(newAngle) || newAngle < 0 || newAngle > 360) {
        alert('회전 각도는 0도에서 360도 사이여야 합니다.');
        return;
      }
      if (isNaN(newZIndex)) {
        alert('우선순위(Z)는 숫자만 입력 가능합니다.');
        return;
      }

      // JointJS 모델 데이터 업데이트
      selectedElement.set('tableName', newName);
      selectedElement.attr('label/text', newName);
      selectedElement.position(newX, newY);
      selectedElement.resize(newWidth, newHeight);
      selectedElement.rotate(newAngle, true);
      selectedElement.set('z', newZIndex);
      selectedElement.set('capacity', newCapacity);
      selectedElement.set('note1', newNote1);
      selectedElement.set('note2', newNote2);
      selectedElement.set('note3', newNote3);

      // Z-Index 정규화 적용 (수동 설정이므로 순서 밀기 생략하고 정렬만 진행)
      bringToFrontAndNormalize(selectedElement, true);

      updateOverlayPosition();
      closeDetailModal();
      pushState();
    };
  }

  function closeDetailModal() {
    detailModal.style.display = 'none';
  }

  // 모달 닫기 이벤트 바인딩
  btnModalClose.addEventListener('click', closeDetailModal);
  btnModalCancel.addEventListener('click', closeDetailModal);

  // 모달 바깥 어두운 영역 클릭 시 닫기
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      closeDetailModal();
    }
  });

  // 3. 조작 오버레이 생성 및 동기화 함수
  function createTransformOverlay(element) {
    removeTransformOverlay(); // 기존 오버레이 제거

    selectedElement = element;

    // 오버레이 DOM 생성
    overlayEl = document.createElement('div');
    overlayEl.className = 'transform-overlay';

    // 구조 정의
    const isGroup = element.get('tableType') === 'Group';
    overlayEl.innerHTML = `
      <div class="overlay-btn-edit" title="이름 변경">✏️</div>
      ${isGroup ? '<div class="overlay-btn-ungroup" title="그룹 해제">🔓</div>' : ''}
      <div class="overlay-btn-remove" title="삭제">×</div>
      <div class="overlay-handle-rotate-line"></div>
      <div class="overlay-handle-rotate" title="회전"></div>
      <div class="overlay-handle-resize" title="크기 변경"></div>
    `;

    paperContainer.appendChild(overlayEl);

    // 이벤트 바인딩
    const editBtn = overlayEl.querySelector('.overlay-btn-edit');
    const removeBtn = overlayEl.querySelector('.overlay-btn-remove');
    const resizeHandle = overlayEl.querySelector('.overlay-handle-resize');
    const rotateHandle = overlayEl.querySelector('.overlay-handle-rotate');

    // [편집 모달 열기] 버튼 이벤트
    editBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openDetailModal(selectedElement);
    });

    if (isGroup) {
      const ungroupBtn = overlayEl.querySelector('.overlay-btn-ungroup');
      ungroupBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (confirm(`"${selectedElement.get('tableName')}" 그룹을 해제하시겠습니까?`)) {
          const children = selectedElement.getEmbeddedCells();
          children.forEach(child => {
            selectedElement.unembed(child);
          });
          selectedElement.remove();
          removeTransformOverlay();
        }
      });
    }

    // [삭제] 버튼 이벤트
    removeBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (confirm(`${selectedElement.get('tableName')}을(를) 삭제하시겠습니까?`)) {
        selectedElement.remove();
        removeTransformOverlay();
      }
    });

    // 중첩 그룹의 모든 하위 자식 노드들까지 재귀적으로 크기 및 위치 비율을 적용하는 헬퍼 함수
    function scaleGroupRecursive(parentGroup, scaleX, scaleY, startParentPos, newParentPos, initialMap) {
      const children = parentGroup.getEmbeddedCells().filter(c => !c.isLink());
      children.forEach(child => {
        const initData = initialMap.get(child.id);
        if (!initData) return;

        const relX = initData.pos.x - startParentPos.x;
        const relY = initData.pos.y - startParentPos.y;

        const newX = newParentPos.x + relX * scaleX;
        const newY = newParentPos.y + relY * scaleY;
        const newW = Math.max(10, Math.round(initData.size.width * scaleX));
        const newH = Math.max(10, Math.round(initData.size.height * scaleY));

        parentGroup.unembed(child);

        // 만약 자식이 또 다른 그룹이라면 하위 요소를 먼저 재귀적으로 스케일링
        if (child.get('tableType') === 'Group') {
          scaleGroupRecursive(child, scaleX, scaleY, initData.pos, { x: newX, y: newY }, initialMap);
        }

        child.position(newX, newY, { fitEmbeds: true });
        child.resize(newW, newH, { fitEmbeds: true });

        parentGroup.embed(child);
      });
    }

    // [크기 조절] 핸들 드래그 이벤트
    resizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const startWidth = selectedElement.size().width;
      const startHeight = selectedElement.size().height;
      const pos = selectedElement.position();
      const angleDeg = selectedElement.angle();
      const angleRad = (angleDeg * Math.PI) / 180;

      // 그룹 내 모든 자식 및 하위 손자 노드들까지 재귀적으로 초기 절대 좌표 및 크기 수집
      const childrenInitialMap = new Map();
      function collectInitialData(parentGroup) {
        parentGroup.getEmbeddedCells().forEach(child => {
          if (child.isLink()) return;
          childrenInitialMap.set(child.id, {
            pos: child.position(),
            size: child.size()
          });
          if (child.get('tableType') === 'Group') {
            collectInitialData(child);
          }
        });
      }
      if (selectedElement.get('tableType') === 'Group') {
        collectInitialData(selectedElement);
      }

      // 마우스 움직임 리스너
      function onMouseMove(moveEvent) {
        // Paper 기준 마우스 상대 좌표 계산
        const containerRect = paperContainer.getBoundingClientRect();
        const mouseX = (moveEvent.clientX - containerRect.left) / currentZoom;
        const mouseY = (moveEvent.clientY - containerRect.top) / currentZoom;

        // 회전을 고려한 역변환 공식 적용 (좌상단 고정점 기준 로컬 좌표 구하기)
        const dx = mouseX - pos.x;
        const dy = mouseY - pos.y;

        const localWidth = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
        const localHeight = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);

        // 최소 치수 보장 (40px)
        let newWidth = Math.max(40, Math.round(localWidth));
        let newHeight = Math.max(40, Math.round(localHeight));

        // Shift 키가 눌린 경우 비율 유지
        if (moveEvent.shiftKey) {
          const aspectRatio = startWidth / startHeight;
          if (newWidth / startWidth > newHeight / startHeight) {
            newHeight = Math.round(newWidth / aspectRatio);
          } else {
            newWidth = Math.round(newHeight * aspectRatio);
          }
          // 최소 치수 재보정
          if (newWidth < 40) {
            newWidth = 40;
            newHeight = Math.round(newWidth / aspectRatio);
          }
          if (newHeight < 40) {
            newHeight = 40;
            newWidth = Math.round(newHeight * aspectRatio);
          }
        }

        selectedElement.resize(newWidth, newHeight);

        // 그룹인 경우 자식들의 위치 및 크기 비율 재귀적 조정
        if (selectedElement.get('tableType') === 'Group' && startWidth > 0 && startHeight > 0) {
          const scaleX = newWidth / startWidth;
          const scaleY = newHeight / startHeight;
          const groupPos = selectedElement.position();

          scaleGroupRecursive(selectedElement, scaleX, scaleY, pos, groupPos, childrenInitialMap);
        }

        updateOverlayPosition();
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // [회전] 핸들 드래그 이벤트
    rotateHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const pos = selectedElement.position();
      const size = selectedElement.size();
      const startAngle = selectedElement.angle();

      // 중심점 계산
      const cx = pos.x + size.width / 2;
      const cy = pos.y + size.height / 2;

      // 그룹 내 자식들의 초기 위치 및 각도 저장
      const childrenInitialData = [];
      if (selectedElement.get('tableType') === 'Group') {
        selectedElement.getEmbeddedCells().forEach(child => {
          const cPos = child.position();
          const cSize = child.size();
          childrenInitialData.push({
            cell: child,
            ccx: cPos.x + cSize.width / 2,
            ccy: cPos.y + cSize.height / 2,
            angle: child.angle()
          });
        });
      }

      function onMouseMove(moveEvent) {
        const containerRect = paperContainer.getBoundingClientRect();
        const mouseX = (moveEvent.clientX - containerRect.left) / currentZoom;
        const mouseY = (moveEvent.clientY - containerRect.top) / currentZoom;

        // 중심점 기준으로 마우스 현재 위치 각도 계산 (라디안)
        const rad = Math.atan2(mouseY - cy, mouseX - cx);
        let deg = (rad * 180) / Math.PI;

        // 회전 핸들이 상단에 있으므로 90도 시프트(보정)하여 자연스러운 회전 처리
        deg = Math.round(deg + 90);

        // Shift 키가 눌린 경우 45도 단위 스냅 적용
        if (moveEvent.shiftKey) {
          deg = Math.round(deg / 45) * 45;
        }

        // 360도 스냅 또는 정리
        if (deg < 0) deg += 360;
        deg = deg % 360;

        selectedElement.rotate(deg, true); // 중심 기준으로 회전

        // 그룹인 경우 자식들의 위치 및 각도 개별 회전 반영
        if (selectedElement.get('tableType') === 'Group') {
          const deltaAngle = deg - startAngle;
          const rotateRad = (deltaAngle * Math.PI) / 180;

          childrenInitialData.forEach(data => {
            const child = data.cell;
            const childSize = child.size();

            // 그룹 중심에서 자식 중심으로의 오프셋 벡터 계산
            const dx = data.ccx - cx;
            const dy = data.ccy - cy;

            // 회전 변환 적용
            const rx = dx * Math.cos(rotateRad) - dy * Math.sin(rotateRad);
            const ry = dx * Math.sin(rotateRad) + dy * Math.cos(rotateRad);

            // 회전된 자식의 새로운 중심
            const newCcx = cx + rx;
            const newCcy = cy + ry;

            selectedElement.unembed(child);
            child.position(newCcx - childSize.width / 2, newCcy - childSize.height / 2);
            child.rotate(data.angle + deltaAngle, true);
            selectedElement.embed(child);
          });
        }

        updateOverlayPosition();
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    updateOverlayPosition();
  }

  // 오버레이 위치 및 각도 갱신 함수
  function updateOverlayPosition() {
    if (!selectedElement || !overlayEl) return;

    const pos = selectedElement.position();
    const size = selectedElement.size();
    const angle = selectedElement.angle();

    overlayEl.style.left = `${pos.x * currentZoom}px`;
    overlayEl.style.top = `${pos.y * currentZoom}px`;
    overlayEl.style.width = `${size.width * currentZoom}px`;
    overlayEl.style.height = `${size.height * currentZoom}px`;
    overlayEl.style.transform = `rotate(${angle}deg)`;
  }

  // 오버레이 제거 함수
  function removeTransformOverlay() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
    selectedElement = null;
  }


  // 그룹 도형 생성 함수
  function createGroup(x, y, w, h, name) {
    const group = new joint.shapes.standard.Rectangle();
    const gName = name || `그룹-${groupCounter++}`;
    group.position(x, y);
    group.resize(w, h);
    group.attr({
      body: {
        fill: 'rgba(168, 85, 247, 0.04)', // 연한 보라색 배경 투명도
        stroke: '#a855f7',
        strokeWidth: 2,
        strokeDasharray: '6 4',
        rx: 10,
        ry: 10
      },
      label: {
        text: gName,
        fill: '#a855f7',
        fontSize: 13,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textVerticalAnchor: 'bottom',
        textAnchor: 'middle',
        refX: '50%',
        refY: -10 // 라벨 상단 바깥쪽 배치
      }
    });
    group.set('tableType', 'Group');
    group.set('tableName', gName);
    group.set('capacity', 0);
    group.set('note1', '');
    group.set('note2', '');
    group.set('note3', '');
    group.addTo(graph);
    return group;
  }

  // 그룹화 핵심 비즈니스 로직 함수
  function groupSelectedElements() {
    if (selectedElements.length < 2) return;

    // 바운딩 박스 계산
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedElements.forEach(el => {
      const pos = el.position();
      const size = el.size();
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + size.width);
      maxY = Math.max(maxY, pos.y + size.height);
    });

    const padding = 15;
    const groupX = minX - padding;
    const groupY = minY - padding;
    const groupW = (maxX - minX) + (padding * 2);
    const groupH = (maxY - minY) + (padding * 2);

    const groupEl = createGroup(groupX, groupY, groupW, groupH);

    selectedElements.forEach(el => {
      groupEl.embed(el);
      highlightElement(el, false);
    });

    // 선택 초기화 및 플로팅 툴바 숨기기 후 생성된 그룹 선택 처리
    selectedElements = [];
    updateSelectionToolbar();
    createTransformOverlay(groupEl);
  }

  // 플로팅 툴바 내부 그룹화 버튼 이벤트 바인딩
  selectionToolbar.querySelector('#btn-selection-group').addEventListener('click', (e) => {
    e.stopPropagation();
    groupSelectedElements();
  });

  // 플로팅 툴바 내부 삭제 버튼 이벤트 바인딩
  selectionToolbar.querySelector('#btn-selection-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    const count = selectedElements.length;
    if (confirm(`선택한 ${count}개의 도형을 모두 삭제하시겠습니까?`)) {
      selectedElements.forEach(el => el.remove());
      clearMultiSelection();
      removeTransformOverlay();
    }
  });

  // Z-Index 및 레이어 우선순위를 위한 bringToFrontAndNormalize 헬퍼 (전체 레이아웃 Z-Index 순차적 정규화)
  function bringToFrontAndNormalize(clickedEl, skipPushToEnd = false) {
    const topEl = clickedEl.getParentCell() || clickedEl;
    const allElements = graph.getElements();
    
    // 1. 최상위 엘리먼트들만 필터링 (부모가 없는 경우)
    const topLevelEls = allElements.filter(el => !el.getParentCell());
    
    // z index 기준으로 오름차순 정렬
    topLevelEls.sort((a, b) => (a.get('z') || 0) - (b.get('z') || 0));
    
    if (!skipPushToEnd) {
      // 클릭된 엘리먼트(의 최상위 부모)를 기존 위치에서 제거하고 맨 뒤(가장 위)로 보냄
      const idx = topLevelEls.indexOf(topEl);
      if (idx > -1) {
        topLevelEls.splice(idx, 1);
      }
      topLevelEls.push(topEl);
    }
    
    // z index를 1부터 차례대로 1씩 증가시키며 부여 (sortElements에 의해 자동 정렬됨)
    let currentZ = 1;
    topLevelEls.forEach(parent => {
      parent.set('z', currentZ);
      currentZ++;
      
      // 만약 그룹(Group) 타입이면 자식들도 z-index를 이어서 부여
      if (parent.get('tableType') === 'Group') {
        const children = parent.getEmbeddedCells();
        children.sort((a, b) => (a.get('z') || 0) - (b.get('z') || 0));
        
        // 클릭된 요소가 자식 중 하나라면 자식 목록의 맨 뒤(가장 위)로 보냄
        if (clickedEl !== parent) {
          const cIdx = children.indexOf(clickedEl);
          if (cIdx > -1) {
            children.splice(cIdx, 1);
            children.push(clickedEl);
          }
        }
        
        children.forEach(child => {
          child.set('z', currentZ);
          currentZ++;
        });
      }
    });
  }

  // 4. 요소 이벤트 연동
  // 요소를 클릭했을 때 조작 오버레이 박스 표시 및 다중선택 분기 처리
  paper.on('element:pointerdown', (elementView, evt) => {
    if (isDeeplyNested(elementView.model)) return; // 뎁스 2 이상 깊게 중첩된 하위 요소는 선택/드래그 불가
    bringToFrontAndNormalize(elementView.model);
    
    const el = elementView.model;
    const isAlreadySelected = selectedElements.includes(el);

    // Shift 키가 눌려있으면 다중 선택 토글
    if (evt.shiftKey) {
      // 만약 단일 선택 오버레이가 켜져 있었다면, 해당 도형을 다중 선택 배열에 먼저 추가해 줌
      if (selectedElement) {
        const prevEl = selectedElement;
        removeTransformOverlay();
        if (!selectedElements.includes(prevEl)) {
          selectedElements.push(prevEl);
          highlightElement(prevEl, true);
        }
      }

      const idx = selectedElements.indexOf(el);
      if (idx > -1) {
        selectedElements.splice(idx, 1);
        highlightElement(el, false);
      } else {
        // 그룹 일부만 선택된 상태에서는 그룹 밖의 대상은 추가 선택하지 못하도록 설정
        const parentP = el.getParentCell();
        if (parentP) {
          // 새로 선택하려는 엘리먼트가 특정 그룹의 자식인 경우
          // 현재 선택된 엘리먼트들 중에 해당 그룹의 자식이 아닌 다른 도형이 하나라도 있다면 추가 선택 차단
          const hasElementOutsideP = selectedElements.some(sel => sel.getParentCell() !== parentP);
          if (hasElementOutsideP) {
            return; // 추가 선택 제한
          }
        } else {
          // 새로 선택하려는 엘리먼트가 탑레벨인 경우
          // 현재 선택된 엘리먼트들 중에 자식 도형(부모가 존재하는 도형)이 하나라도 있다면 추가 선택 차단
          const hasChildElements = selectedElements.some(sel => sel.getParentCell() !== null);
          if (hasChildElements) {
            return; // 추가 선택 제한
          }
        }

        selectedElements.push(el);
        highlightElement(el, true);
      }

      // 그룹 전체 선택 시 승격 처리
      resolveGroupSelection();

      // 만약 Shift 클릭 후 최종 선택된 도형이 1개뿐이라면, 단일 선택으로 자동 전환
      if (selectedElements.length === 1) {
        const singleEl = selectedElements[0];
        clearMultiSelection();
        createTransformOverlay(singleEl);
      } else {
        updateSelectionToolbar();
      }
    } else {
      if (isAlreadySelected) {
        // 이미 다중 선택된 상태의 도형을 클릭했으므로 다중 선택을 유지하여 함께 드래그할 수 있도록 함
        removeTransformOverlay();
      } else {
        // 다중선택 초기화 후 단일 오버레이 활성화
        clearMultiSelection();
        createTransformOverlay(el);
      }
    }

    // 다중 선택 상태(2개 이상 혹은 이미 선택된 유일한 요소)에서 드래그 처리
    if (selectedElements.length > 0 && selectedElements.includes(el)) {
      isMultiDragging = true;
      const initialPositions = selectedElements.map(selEl => ({
        model: selEl,
        x: selEl.position().x,
        y: selEl.position().y
      }));
      const startX = el.position().x;
      const startY = el.position().y;
      let hasMoved = false;

      const onPositionChange = (model, pos, opt) => {
        if (opt && opt.multiDrag) return;
        hasMoved = true;
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        initialPositions.forEach(item => {
          if (item.model !== el) {
            // 부모가 함께 선택되어 있다면 자식은 개별적으로 이동시키지 않음 (JointJS가 부모 이동시 자식도 자동 이동시키므로)
            const parentCell = item.model.getParentCell();
            if (parentCell && selectedElements.includes(parentCell)) {
              return;
            }
            item.model.position(item.x + dx, item.y + dy, { multiDrag: true });
          }
        });
      };

      el.on('change:position', onPositionChange);

      const onPointerUp = () => {
        isMultiDragging = false;
        el.off('change:position', onPositionChange);
        paper.off('cell:pointerup', onPointerUp);
        
        // 만약 실제로 마우스 이동이 거의 또는 아예 없었고, Shift 키도 안 눌렸다면, 
        // 클릭한 이 도형만 단일 선택하고 나머지 선택 해제
        if (!hasMoved && !evt.shiftKey) {
          clearMultiSelection();
          createTransformOverlay(el);
        } else {
          // 이동했다면 다중 선택 툴바 위치 등을 갱신
          updateSelectionToolbar();
        }
      };
      paper.on('cell:pointerup', onPointerUp);
    }
  });

  // 요소를 드래그하여 이동할 때 오버레이 실시간 추적
  graph.on('change:position', () => {
    updateOverlayPosition();
  });

  // 그룹 영역 자동 피팅 헬퍼 함수
  function fitGroupToChildren(parentCell) {
    const children = parentCell.getEmbeddedCells();
    if (children.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    children.forEach(child => {
      const pos = child.position();
      const size = child.size();
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + size.width);
      maxY = Math.max(maxY, pos.y + size.height);
    });

    const padding = 15;
    const newX = minX - padding;
    const newY = minY - padding;
    const newW = (maxX - minX) + (padding * 2);
    const newH = (maxY - minY) + (padding * 2);

    const parentPos = parentCell.position();
    const dx = newX - parentPos.x;
    const dy = newY - parentPos.y;

    if (dx !== 0 || dy !== 0 || parentCell.size().width !== newW || parentCell.size().height !== newH) {
      // 1. 부모가 움직이기 전 자식들의 원래 절대 좌표를 먼저 보존
      const childOriginalPositions = children.map(child => ({
        model: child,
        x: child.position().x,
        y: child.position().y
      }));

      // 2. 부모 크기 및 위치 조정
      parentCell.resize(newW, newH, { fitEmbeds: true });
      parentCell.position(newX, newY, { fitEmbeds: true });

      // 3. 자식들을 원래 위치로 정확히 복원
      childOriginalPositions.forEach(item => {
        item.model.position(item.x, item.y, { fitEmbeds: true });
      });
    }
  }

  // 그룹 내 내부 도형 이동/크기 변경 시 그룹 영역 자동으로 조절되도록 동적 반영 (사용자 드래그 중에는 무시하여 좌표 튀는 버그 방지)
  graph.on('change:position change:size', (cell, val, opt) => {
    if (isMultiDragging || (opt && (opt.fitEmbeds || opt.ui || opt.multiDrag))) return;
    const parentCell = cell.getParentCell();
    if (parentCell && parentCell.get('tableType') === 'Group') {
      fitGroupToChildren(parentCell);
    }
  });

  // 요소를 회전할 때 라벨 텍스트의 정방향 유지 (역회전 값 부여)
  graph.on('change:angle', (element, angle) => {
    element.attr('label/transform', `rotate(${-angle})`);
  });

  // 빈 캔버스 클릭 및 드래그 마키 선택 (다중 선택)
  paper.on('blank:pointerdown', (evt, x, y) => {
    // 만약 선택 플로팅 툴바 영역을 클릭한 것이라면 무시
    if (evt.target.closest('#selection-toolbar') || evt.target.closest('.selection-toolbar')) {
      return;
    }
    removeTransformOverlay();
    clearMultiSelection();
    updateSelectionToolbar();

    const startX = evt.clientX;
    const startY = evt.clientY;
    const localStartX = x;
    const localStartY = y;

    const marquee = document.createElement('div');
    marquee.className = 'selection-marquee';
    const paperContainerRect = paperContainer.getBoundingClientRect();
    marquee.style.left = `${startX - paperContainerRect.left}px`;
    marquee.style.top = `${startY - paperContainerRect.top}px`;
    marquee.style.width = '0px';
    marquee.style.height = '0px';
    paperContainer.appendChild(marquee);

    function onMouseMove(moveEvent) {
      const containerRect = paperContainer.getBoundingClientRect();
      const curX = moveEvent.clientX;
      const curY = moveEvent.clientY;

      const left = Math.min(startX, curX) - containerRect.left;
      const top = Math.min(startY, curY) - containerRect.top;
      const width = Math.abs(startX - curX);
      const height = Math.abs(startY - curY);

      marquee.style.left = `${left}px`;
      marquee.style.top = `${top}px`;
      marquee.style.width = `${width}px`;
      marquee.style.height = `${height}px`;

      const localCurX = localStartX + (curX - startX) / currentZoom;
      const localCurY = localStartY + (curY - startY) / currentZoom;
      const rectX = Math.min(localStartX, localCurX);
      const rectY = Math.min(localStartY, localCurY);
      const rectW = Math.abs(localStartX - localCurX);
      const rectH = Math.abs(localStartY - localCurY);

      const area = { x: rectX, y: rectY, width: rectW, height: rectH };
      const views = paper.findViewsInArea(area);

      // 드래그 영역 내 도형들만 다중 선택 하이라이팅
      clearMultiSelection();
      
      let candidateElements = views.map(view => view.model).filter(el => !el.isLink() && !isDeeplyNested(el));

      // 1. 그룹 내 모든 자식이 드래그 영역에 들어왔거나, 부모 그룹 자체가 드래그 영역에 직접 포함된 경우 
      //    자식 도형들을 후보군에서 제외하고 부모 그룹 자체만 선택 후보군으로 승격/유지
      let changed = false;
      const groups = graph.getCells().filter(cell => cell.get('tableType') === 'Group');
      do {
        changed = false;
        for (const group of groups) {
          const children = group.getEmbeddedCells().filter(c => !c.isLink());
          if (children.length === 0) continue;
          
          const isParentInCandidates = candidateElements.includes(group);
          const allChildrenInCandidates = children.every(c => candidateElements.includes(c));
          
          if (isParentInCandidates || allChildrenInCandidates) {
            const prevLength = candidateElements.length;
            candidateElements = candidateElements.filter(c => !children.includes(c));
            if (!candidateElements.includes(group)) {
              candidateElements.push(group);
            }
            if (candidateElements.length !== prevLength || !isParentInCandidates) {
              changed = true;
            }
          }
        }
      } while (changed);

      // 2. 그룹 일부만 선택된 상태에서는 그룹 밖의 대상은 추가 선택하지 못하도록 필터링
      const partialGroupMap = new Map();
      candidateElements.forEach(el => {
        const parent = el.getParentCell();
        if (parent) {
          if (!partialGroupMap.has(parent)) {
            partialGroupMap.set(parent, []);
          }
          partialGroupMap.get(parent).push(el);
        }
      });

      if (partialGroupMap.size > 0) {
        // 일부만 선택된 그룹들 중 자식이 가장 많이 포함된 그룹을 선택
        let bestParent = null;
        let maxCount = 0;
        for (const [parent, list] of partialGroupMap.entries()) {
          if (list.length > maxCount) {
            maxCount = list.length;
            bestParent = parent;
          }
        }
        // 해당 그룹의 자식들만 선택으로 남김
        candidateElements = candidateElements.filter(el => el.getParentCell() === bestParent);
      }

      // 최종 선택된 요소들 하이라이팅 처리
      candidateElements.forEach(el => {
        if (selectedElements.indexOf(el) === -1) {
          selectedElements.push(el);
          highlightElement(el, true);
        }
      });
      // 임시로 수동으로 툴바 노출 (clearMultiSelection이 감췄으므로 다시 갱신)
      updateSelectionToolbar();
    }

    function onMouseUp() {
      marquee.remove();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // 드래그 마키 영역으로 1개의 도형만 잡힌 경우 단일 선택으로 자동 전환
      if (selectedElements.length === 1) {
        const singleEl = selectedElements[0];
        clearMultiSelection();
        createTransformOverlay(singleEl);
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // 요소를 더블 클릭했을 때 상세 정보 편집 모달 표시
  paper.on('element:pointerdblclick', (elementView) => {
    // 그룹인 경우 상세편집 제외 가능
    if (elementView.model.get('tableType') === 'Group') return;
    if (isDeeplyNested(elementView.model)) return; // 뎁스 2 이상 깊게 중첩된 하위 요소는 더블클릭 상세조정 불가
    openDetailModal(elementView.model);
  });

  // 5. 도형 생성 함수 재구성
  // 사각형 생성
  function createRectangle(x, y) {
    const rect = new joint.shapes.standard.Rectangle();
    const tableName = `사각형-${shapeCounter++}`;
    rect.position(x, y);
    rect.resize(100, 100);
    rect.attr({
      body: {
        // 테이블 이미지를 SVG 패턴으로 채움 (도형 경계 내부에만 표시)
        fill: 'url(#table-bg-pattern)',
        stroke: '#06b6d4',
        strokeWidth: 2,
        rx: 8,
        ry: 8
      },
      label: {
        text: tableName,
        fill: '#ffffff',
        fontSize: 13,
        fontFamily: 'Inter',
        fontWeight: '700',
        // 어두운 외곽선으로 밝은 배경에서도 흰 글자가 선명하게 보이도록
        stroke: '#0d1321',
        strokeWidth: 3,
        paintOrder: 'stroke fill' // stroke를 fill 아래에 렌더링하는 SVG 트릭
      }
    });

    rect.set('tableType', 'Rectangle');
    rect.set('tableName', tableName);
    rect.set('capacity', 4);
    rect.set('note1', '');
    rect.set('note2', '');
    rect.set('note3', '');
    rect.addTo(graph);
    createTransformOverlay(rect); // 생성 직후 선택 처리
    return rect;
  }

  // 원/타원형 생성
  function createCircle(x, y) {
    const ellipse = new joint.shapes.standard.Ellipse();
    const tableName = `원형-${shapeCounter++}`;
    ellipse.position(x, y);
    ellipse.resize(100, 100);
    ellipse.attr({
      body: {
        fill: 'rgba(168, 85, 247, 0.15)', // Purple
        stroke: '#a855f7',
        strokeWidth: 2
      },
      label: {
        text: tableName,
        fill: '#f8fafc',
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: '500'
      }
    });

    ellipse.set('tableType', 'Ellipse');
    ellipse.set('tableName', tableName);
    ellipse.set('capacity', 2);
    ellipse.set('note1', '');
    ellipse.set('note2', '');
    ellipse.set('note3', '');
    ellipse.addTo(graph);
    createTransformOverlay(ellipse); // 생성 직후 선택 처리
    return ellipse;
  }

  // 삼각형 생성 (Polygon standard shape 이용)
  function createTriangle(x, y) {
    const triangle = new joint.shapes.standard.Polygon();
    const tableName = `삼각형-${shapeCounter++}`;
    triangle.position(x, y);
    triangle.resize(100, 100);
    triangle.attr({
      body: {
        refPoints: '50,0 0,100 100,100',
        fill: 'rgba(16, 185, 129, 0.15)', // Emerald
        stroke: '#10b981',
        strokeWidth: 2
      },
      label: {
        text: tableName,
        fill: '#f8fafc',
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: '500',
        refY: '75%' // 삼각형 형태에 맞춰 라벨이 중앙 하단에 오도록 시프트
      }
    });

    triangle.set('tableType', 'Triangle');
    triangle.set('tableName', tableName);
    triangle.set('capacity', 3);
    triangle.set('note1', '');
    triangle.set('note2', '');
    triangle.set('note3', '');
    triangle.addTo(graph);
    createTransformOverlay(triangle);
    return triangle;
  }

  // 마름모 생성 (Polygon standard shape 이용)
  function createDiamond(x, y) {
    const diamond = new joint.shapes.standard.Polygon();
    const tableName = `마름모-${shapeCounter++}`;
    diamond.position(x, y);
    diamond.resize(100, 100);
    diamond.attr({
      body: {
        refPoints: '50,0 100,50 50,100 0,50',
        fill: 'rgba(245, 158, 11, 0.15)', // Amber / Gold
        stroke: '#f59e0b',
        strokeWidth: 2
      },
      label: {
        text: tableName,
        fill: '#f8fafc',
        fontSize: 12,
        fontFamily: 'Inter',
        fontWeight: '500'
      }
    });

    diamond.set('tableType', 'Diamond');
    diamond.set('tableName', tableName);
    diamond.set('capacity', 4);
    diamond.set('note1', '');
    diamond.set('note2', '');
    diamond.set('note3', '');
    diamond.addTo(graph);
    createTransformOverlay(diamond);
    return diamond;
  }

  // 초기 데모 도형들
  createRectangle(150, 150);
  createCircle(350, 150);
  createTriangle(150, 320);
  createDiamond(350, 320);

  // 6. 버튼 이벤트 연결
  document.getElementById('add-rect').addEventListener('click', () => {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    createRectangle(x, y);
  });

  document.getElementById('add-circle').addEventListener('click', () => {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    createCircle(x, y);
  });

  document.getElementById('add-triangle').addEventListener('click', () => {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    createTriangle(x, y);
  });

  document.getElementById('add-diamond').addEventListener('click', () => {
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;
    createDiamond(x, y);
  });

  // 7. 데이터 추출 및 저장 로직 (쿠키 연동 및 목록 UI 제어)
  const saveBtn = document.getElementById('save-layout');
  const jsonOutput = document.getElementById('json-output');
  const layoutsContainer = document.getElementById('saved-layouts-container');
  const layoutsList = document.getElementById('saved-layouts-list');

  // 쿠키 헬퍼 함수
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
  }

  // 쿠키에서 전체 레이아웃 리스트 가져오기 (개별 쿠키 방식)
  function getSavedLayouts() {
    const cookies = document.cookie.split('; ');
    const layouts = [];
    cookies.forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts[0];
      if (key.startsWith('hotel_layout_')) {
        const val = parts.slice(1).join('=');
        try {
          layouts.push(JSON.parse(decodeURIComponent(val)));
        } catch (e) {
          console.error('Failed to parse layout cookie:', key, e);
        }
      }
    });
    // 저장된 일시 순으로 정렬
    return layouts.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // 개별 레이아웃 쿠키 삭제
  function deleteLayoutCookie(layoutName) {
    setCookie('hotel_layout_' + encodeURIComponent(layoutName), '', -1);
  }

  // 개별 레이아웃 쿠키 저장
  function saveLayoutToCookie(layout) {
    setCookie('hotel_layout_' + encodeURIComponent(layout.name), encodeURIComponent(JSON.stringify(layout)));
  }

  // 레이아웃 목록 렌더링 함수
  function renderSavedLayouts() {
    const layouts = getSavedLayouts();
    if (layouts.length === 0) {
      layoutsContainer.style.display = 'none';
      return;
    }

    layoutsContainer.style.display = 'block';
    layoutsList.innerHTML = '';

    layouts.forEach(layout => {
      const item = document.createElement('div');
      item.className = 'layout-item';
      
      const info = document.createElement('div');
      info.className = 'layout-info';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'layout-name';
      nameSpan.textContent = layout.name;
      
      const dateSpan = document.createElement('span');
      dateSpan.className = 'layout-date';
      dateSpan.textContent = layout.date;
      
      info.appendChild(nameSpan);
      info.appendChild(dateSpan);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'layout-delete-btn';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = '레이아웃 삭제';
      
      item.appendChild(info);
      item.appendChild(deleteBtn);
      
      // 행 클릭 시 레이아웃 불러오기
      item.addEventListener('click', (e) => {
        // 삭제 버튼 클릭 시 차단
        if (e.target.closest('.layout-delete-btn')) {
          if (confirm(`"${layout.name}" 레이아웃을 삭제하시겠습니까?`)) {
            deleteLayoutCookie(layout.name);
            renderSavedLayouts();
          }
          return;
        }

        if (confirm(`"${layout.name}" 레이아웃을 불러 오시겠습니까?`)) {
          loadLayout(layout);
        }
      });
      
      layoutsList.appendChild(item);
    });
  }

  // 레이아웃 불러오기 구현
  function loadLayout(layout) {
    graph.clear();
    removeTransformOverlay();

    // 임시 카운터 리셋 또는 보정 (겹치지 않게 하기 위함)
    let maxCounter = 0;
    const idMap = {};

    // 1단계: 도형 생성
    layout.shapes.forEach(shapeData => {
      let shape;
      const x = shapeData.position.x;
      const y = shapeData.position.y;
      
      if (shapeData.tableType === 'Rectangle') {
        shape = createRectangle(x, y);
      } else if (shapeData.tableType === 'Ellipse') {
        shape = createCircle(x, y);
      } else if (shapeData.tableType === 'Triangle') {
        shape = createTriangle(x, y);
      } else if (shapeData.tableType === 'Diamond') {
        shape = createDiamond(x, y);
      } else if (shapeData.tableType === 'Group') {
        shape = createGroup(x, y, shapeData.size.width, shapeData.size.height, shapeData.tableName);
      }

      if (shape) {
        shape.resize(shapeData.size.width, shapeData.size.height);
        shape.rotate(shapeData.angle || 0, true);
        shape.set('z', shapeData.zIndex || 0);
        shape.set('tableName', shapeData.tableName);
        shape.attr('label/text', shapeData.tableName);
        shape.set('capacity', shapeData.capacity);
        shape.set('note1', shapeData.note1 || '');
        shape.set('note2', shapeData.note2 || '');
        shape.set('note3', shapeData.note3 || '');
        idMap[shapeData.id] = shape;

        // 카운터 넘버링 추출
        const numPart = shapeData.tableName.match(/\d+/);
        if (numPart) {
          const num = parseInt(numPart[0], 10);
          if (num > maxCounter) maxCounter = num;
        }
      }
    });

    // 2단계: 부모-자식 그룹 관계 설정
    layout.shapes.forEach(shapeData => {
      if (shapeData.parent && idMap[shapeData.parent] && idMap[shapeData.id]) {
        idMap[shapeData.parent].embed(idMap[shapeData.id]);
      }
    });

    // 3단계: 로드 완료 후 전체 엘리먼트 Z-Index 순차적 정규화 정렬 적용
    const allEls = graph.getElements();
    if (allEls.length > 0) {
      bringToFrontAndNormalize(allEls[0]);
    }

    shapeCounter = maxCounter + 1;

    // 예약일자 복원
    if (layout.datepickerDate) {
      datepicker.setDate(new Date(layout.datepickerDate));
    }
    if (layout.oldCalendarDate) {
      const oldInput = document.getElementById('old-datepicker-input');
      if (oldInput) {
        oldInput.value = layout.oldCalendarDate;
      }
      if (oldCalendarInstance) {
        oldCalendarInstance.gotoDate(layout.oldCalendarDate);
      }
    }

    // JSON 출력 영역 동기화
    jsonOutput.textContent = JSON.stringify(layout.shapes, null, 2);
    
    // 오버레이 제거하여 깔끔한 기본 상태 유지
    removeTransformOverlay();
    
    // 불러오기 시점 히스토리 리셋 (되돌리기 불가 기준점 확보)
    resetHistory();
  }

  // 초기 로드시 목록 렌더링
  renderSavedLayouts();

  // 도움말 접기/펼기 이벤트 연결
  const tipsToggleBtn = document.getElementById('tips-toggle-btn');
  const tipsContent = document.getElementById('tips-body'); // HTML ID: tips-body
  const tipsToggleIcon = tipsToggleBtn ? tipsToggleBtn.querySelector('.tips-toggle-icon') : null;

  if (tipsToggleBtn && tipsContent) {
    tipsToggleBtn.addEventListener('click', () => {
      const isCollapsed = tipsContent.style.display === 'none';
      tipsContent.style.display = isCollapsed ? 'block' : 'none';
      if (tipsToggleIcon) {
        tipsToggleIcon.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
      }
    });
  }

  // 도움말 탭 전환 로직 (기본 조작 / 단축키)
  const tipsTabBtns = document.querySelectorAll('.tips-tab-btn');
  const tipsBasicContent = document.getElementById('tips-basic-content');
  const tipsShortcutsContent = document.getElementById('tips-shortcuts-content');

  tipsTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // 모든 탭 버튼에서 active 클래스 제거
      tipsTabBtns.forEach(b => b.classList.remove('active'));
      // 클릭된 탭 버튼에 active 클래스 추가
      btn.classList.add('active');

      // 콘텐츠 전환
      if (tipsBasicContent) tipsBasicContent.style.display = targetTab === 'basic' ? 'block' : 'none';
      if (tipsShortcutsContent) tipsShortcutsContent.style.display = targetTab === 'shortcuts' ? 'block' : 'none';
    });
  });


  saveBtn.addEventListener('click', () => {
    const layoutNameInput = prompt('저장할 레이아웃 이름을 입력해 주세요:');
    if (!layoutNameInput) {
      if (layoutNameInput === '') {
        alert('레이아웃 이름을 한 글자 이상 입력해 주세요.');
      }
      return;
    }
    const cleanName = layoutNameInput.trim();
    if (!cleanName) {
      alert('유효한 레이아웃 이름을 입력해 주세요.');
      return;
    }

    const elements = graph.getElements();
    const tableData = elements.map(el => {
      const position = el.position();
      const size = el.size();
      const angle = el.angle();
      const parentCell = el.getParentCell();

      return {
        id: el.id,
        parent: parentCell ? parentCell.id : null,
        tableName: el.get('tableName') || 'Unknown Shape',
        tableType: el.get('tableType') || 'Unknown Shape Type',
        capacity: el.get('capacity') || 0,
        position: {
          x: Math.round(position.x),
          y: Math.round(position.y)
        },
        size: {
          width: Math.round(size.width),
          height: Math.round(size.height)
        },
        angle: angle,
        zIndex: el.get('z') || 0,
        note1: el.get('note1') || '',
        note2: el.get('note2') || '',
        note3: el.get('note3') || ''
      };
    });

    // 화면 하단의 pre 태그에 JSON 데이터 출력
    jsonOutput.textContent = JSON.stringify(tableData, null, 2);

    // 날짜 정보 획득
    const datepickerDate = document.getElementById('datepicker-input').value;
    const oldCalendarDate = document.getElementById('old-datepicker-input').value;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLayout = {
      name: cleanName,
      date: dateStr,
      shapes: tableData,
      datepickerDate: datepickerDate,
      oldCalendarDate: oldCalendarDate
    };

    // 개별 쿠키에 신규 레이아웃 저장
    saveLayoutToCookie(newLayout);
    renderSavedLayouts();

    console.log('Saved Layout Data:', newLayout);

    // 버튼 피드백 애니메이션
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      저장 완료!
    `;
    saveBtn.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(6, 182, 212, 0.4))';
    saveBtn.style.borderColor = '#10b981';

    setTimeout(() => {
      saveBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
        </svg>
        레이아웃 저장
      `;
      saveBtn.style.background = '';
      saveBtn.style.borderColor = '';
    }, 2000);
  });

  // 좌우 사이드바 접기/펼치기 토글 이벤트 연결
  const leftSidebar = document.querySelector('.sidebar');
  const btnToggleLeft = document.getElementById('btn-toggle-left');
  btnToggleLeft.addEventListener('click', () => {
    leftSidebar.classList.toggle('collapsed');
    btnToggleLeft.classList.toggle('collapsed');
    if (leftSidebar.classList.contains('collapsed')) {
      btnToggleLeft.textContent = '►';
    } else {
      btnToggleLeft.textContent = '◄';
    }
    // 접힐 때 뷰포트 크기가 변하므로 리사이즈 처리
    setTimeout(resizePaper, 300); // 300ms transition 대기 후 한 번 더 보정
    resizePaper();
  });

  const rightSidebar = document.querySelector('.output-panel');
  const btnToggleRight = document.getElementById('btn-toggle-right');
  btnToggleRight.addEventListener('click', () => {
    rightSidebar.classList.toggle('collapsed');
    btnToggleRight.classList.toggle('collapsed');
    if (rightSidebar.classList.contains('collapsed')) {
      btnToggleRight.textContent = '◄';
    } else {
      btnToggleRight.textContent = '►';
    }
    // 접힐 때 뷰포트 크기가 변하므로 리사이즈 처리
    setTimeout(resizePaper, 300);
    resizePaper();
  });

  // 줌인 / 줌아웃 / 리셋 이벤트 연결
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');

  if (btnZoomIn && btnZoomOut && btnZoomReset) {
    btnZoomIn.addEventListener('click', () => {
      if (currentZoom < 2.0) {
        currentZoom = parseFloat((currentZoom + 0.1).toFixed(1));
        paper.scale(currentZoom, currentZoom);
        resizePaper();
        pushState();
      }
    });

    btnZoomOut.addEventListener('click', () => {
      if (currentZoom > 0.5) {
        currentZoom = parseFloat((currentZoom - 0.1).toFixed(1));
        paper.scale(currentZoom, currentZoom);
        resizePaper();
        pushState();
      }
    });

    btnZoomReset.addEventListener('click', () => {
      if (currentZoom !== 1.0) {
        currentZoom = 1.0;
        paper.scale(currentZoom, currentZoom);
        resizePaper();
        pushState();
      }
    });
  }

  // Delete 및 Ctrl+Z / Ctrl+Y 키 단축키 구현
  document.addEventListener('keydown', (e) => {
    // 텍스트 인풋 또는 편집 필드에 포커스된 경우 단축키 방지
    if (document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA' || 
      document.activeElement.isContentEditable
    )) {
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && e.key.toLowerCase() === 'z') {
      // Ctrl + Z (되돌리기)
      e.preventDefault();
      undo();
    } else if (isCtrl && e.key.toLowerCase() === 'y') {
      // Ctrl + Y (앞으로 돌리기)
      e.preventDefault();
      redo();
    } else if (e.key === 'Delete') {
      if (selectedElements && selectedElements.length > 0) {
        // 다중 선택 삭제
        e.preventDefault();
        const count = selectedElements.length;
        if (confirm(`선택한 ${count}개의 도형을 모두 삭제하시겠습니까?`)) {
          selectedElements.forEach(el => el.remove());
          clearMultiSelection();
          removeTransformOverlay();
        }
      } else if (selectedElement) {
        // 단일 선택 삭제
        e.preventDefault();
        const tableName = selectedElement.get('tableName') || '도형';
        if (confirm(`"${tableName}"을(를) 삭제하시겠습니까?`)) {
          selectedElement.remove();
          removeTransformOverlay();
        }
      }
    }
  });
});

