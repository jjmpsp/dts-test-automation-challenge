// Determine the API URL based on whether we're using a Docker service name
const API_BASE_URL = (window.__CONFIG__ && window.__CONFIG__.API_BASE_URL) || "http://localhost:41010";

// If the API_BASE_URL is using a Docker service name (like http://api:port), use relative paths instead
// This is because browsers can't resolve Docker service names directly
const API = API_BASE_URL.startsWith('http://api:') || API_BASE_URL.startsWith('http://runner:')
  ? ''  // Use relative paths when in Docker environment
  : API_BASE_URL;

const out = document.getElementById("out");
const runsTbody = document.querySelector("#runsTable tbody");
const detailsMeta = document.getElementById("detailsMeta");
const screenshotsDiv = document.getElementById("screenshots");

const scenarioSelect = document.getElementById("scenarioSelect");
const statusFilterEl = document.getElementById("statusFilter");
const typeFilterEl = document.getElementById("typeFilter");

const diffAEl = document.getElementById("diffA");
const diffBEl = document.getElementById("diffB");
const testsList = document.getElementById("testsList");

let scenariosById = {};
let scenarios = [];
let runsCache = [];
let lastPick = "A";
let selectedRunId = null;
let currentGalleryIndex = 0;
let currentGalleryImages = [];

// Pagination variables
let currentPage = 1;
const itemsPerPage = 5;
let paginatedRuns = [];

function fmtDate(ts) {
  try { return new Date(ts * 1000).toISOString().replace('T',' ').replace('Z',''); }
  catch { return String(ts); }
}

function durationMs(r) {
  if (!r.finished_at || !r.started_at) return "";
  return Math.round((r.finished_at - r.started_at) * 1000);
}

function esc(s) {
  return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

async function loadScenarios() {
  const r = await fetch(API ? `${API}/api/scenarios` : '/api/scenarios');
  const j = await r.json();
  scenarios = j.scenarios || [];
  scenariosById = {};
  const types = new Set();

  for (const s of scenarios) {
    scenariosById[s.id] = s;
    if (s.type) types.add(s.type);
  }

  const currentScenario = scenarioSelect.value || scenarios[0]?.id || "";
  scenarioSelect.innerHTML = scenarios.map(s => `<option value="${s.id}">${esc(s.id)} - ${esc(s.title)}</option>`).join("");
  if (scenariosById[currentScenario]) scenarioSelect.value = currentScenario;

  const currentType = typeFilterEl.value;
  typeFilterEl.innerHTML = `<option value="">All</option>` +
    [...types].sort().map(t => `<option value="${t}">${t}</option>`).join("");
  if ([...types].includes(currentType)) typeFilterEl.value = currentType;

  renderTestsForSelectedScenario();
}

function renderTestsForSelectedScenario() {
  const sid = scenarioSelect.value;
  const scenario = scenariosById[sid];
  testsList.innerHTML = "";
  if (!scenario) return;

  for (const t of (scenario.tests || [])) {
    const row = document.createElement("label");
    row.className = "testItem";
    row.innerHTML = `<input type="checkbox" data-test-title="${esc(t)}" /> <span>${esc(t)}</span>`;
    testsList.appendChild(row);
  }
}

function getSelectedTests() {
  const boxes = testsList.querySelectorAll("input[type='checkbox']");
  const selected = [];
  boxes.forEach(b => { if (b.checked) selected.push(b.getAttribute("data-test-title")); });
  return selected;
}

function applyFilters(runs) {
  const status = statusFilterEl.value.trim();
  const type = typeFilterEl.value.trim();

  return runs.filter(r => {
    if (status && r.status !== status) return false;
    const st = scenariosById[r.scenario_id]?.type || "";
    if (type && st !== type) return false;
    return true;
  });
}

function renderRuns(runs) {
  // Store the runs for pagination
  paginatedRuns = runs;
  
  // Calculate pagination
  const totalPages = Math.ceil(runs.length / itemsPerPage);
  currentPage = Math.min(currentPage, totalPages || 1); // Make sure current page is valid
  
  // Get runs for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const runsForPage = runs.slice(startIndex, endIndex);
  
  // Clear table body
  runsTbody.innerHTML = "";
  
  // Add runs for current page
  for (const r of runsForPage) {
    const tr = document.createElement("tr");
    const scenario = scenariosById[r.scenario_id];
    const stype = scenario?.type || "unknown";
    const dur = durationMs(r);
    
    // Determine the number of tests to display
    let testsCount;
    if (r.selected_tests === null) {
      // If selected_tests is null, it means "Run all" was clicked, so show total tests in scenario
      testsCount = scenario?.tests?.length || 0;
    } else if (Array.isArray(r.selected_tests) && r.selected_tests.length > 0) {
      // If specific tests were selected, show the count of selected tests
      testsCount = r.selected_tests.length;
    } else {
      // Otherwise, show the count of tests from the run details (when available)
      testsCount = (r.details?.tests || []).length;
    }
    
    tr.innerHTML = `
      <td>${esc(r.id)}</td>
      <td>${esc(r.scenario_id)}</td>
      <td>${esc(stype)}</td>
      <td>${esc(r.status)}</td>
      <td>${testsCount}</td>
      <td>${dur !== "" ? dur + " ms" : ""}</td>
      <td>${fmtDate(r.started_at)}</td>
    `;
    
    // Add selection highlighting
    if (selectedRunId === r.id) {
      tr.classList.add("selected");
    }
    
    tr.addEventListener("click", async () => {
      // Remove selection from previously selected row
      const prevSelected = runsTbody.querySelector("tr.selected");
      if (prevSelected) {
        prevSelected.classList.remove("selected");
      }
      
      // Highlight the clicked row
      tr.classList.add("selected");
      selectedRunId = r.id;
      
      if (lastPick === "A") { diffAEl.value = r.id; lastPick = "B"; }
      else { diffBEl.value = r.id; lastPick = "A"; }
      const details = await fetch(API ? `${API}/runs/${r.id}` : `/runs/${r.id}`).then(x => x.json());
      renderDetails(details);
    });
    runsTbody.appendChild(tr);
  }
  
  // Update pagination controls
  updatePaginationControls(totalPages);
}

function updatePaginationControls(totalPages) {
  const pageInfo = document.getElementById("pageInfo");
  const currentPageSpan = document.getElementById("currentPage");
  const totalPagesSpan = document.getElementById("totalPages");
  const prevButton = document.getElementById("prevPage");
  const nextButton = document.getElementById("nextPage");
  
  // Update page info
  currentPageSpan.textContent = currentPage;
  totalPagesSpan.textContent = totalPages || 1;
  
  // Enable/disable buttons based on current page
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= (totalPages || 1);
  
  // Add event listeners for pagination buttons
  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderRuns(applyFilters(runsCache)); // Re-render with current cache
    }
  };
  
  nextButton.onclick = () => {
    if (currentPage < (totalPages || 1)) {
      currentPage++;
      renderRuns(applyFilters(runsCache)); // Re-render with current cache
    }
  };
}

function renderDetails(run) {
 screenshotsDiv.innerHTML = "";
  screenshotsDiv.className = "shots"; // Ensure the CSS class is applied
  detailsMeta.innerHTML = "";

  // Calculate test counts from the run details
  let passed = 0;
  let failed = 0;
  let total = 0;

  // Check if run.details exists and has tests data
  if (run.details && run.details.tests && Array.isArray(run.details.tests)) {
    total = run.details.tests.length;
    passed = run.details.tests.filter(test => test.status === 'pass').length;
    failed = run.details.tests.filter(test => test.status === 'fail').length;
  } else {
    // Fallback to meta.summary if tests array is not available
    const summary = run.details?.meta?.summary || { pass: 0, fail: 0, total: 0 };
    passed = summary.pass || 0;
    failed = summary.fail || 0;
    total = summary.total || 0;
  }
  
  // Double check: if summary counts are all zero but we have tests, recalculate
 if (passed === 0 && failed === 0 && total === 0 && run.details && run.details.tests && Array.isArray(run.details.tests)) {
    total = run.details.tests.length;
    passed = run.details.tests.filter(test => test.status === 'pass').length;
    failed = run.details.tests.filter(test => test.status === 'fail').length;
  }
  
  // Create a summary table with icons for pass/fail/total
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "test-summary";
  summaryDiv.innerHTML = `
    <table class="summary-table w-full border-collapse mb-3">
      <thead>
        <tr>
          <th class="py-2 px-3 border-b border-custom-border text-left">Test Results</th>
          <th class="py-2 px-3 border-b border-custom-border text-center">Count</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="py-2 px-3 border-b border-custom-border">
            <span class="summary-icon pass-icon">✓</span>
            <span class="summary-label">Passed</span>
          </td>
          <td class="py-2 px-3 border-b border-custom-border text-center">
            <span class="summary-count pass-count">${passed}</span>
          </td>
        </tr>
        <tr>
          <td class="py-2 px-3 border-b border-custom-border">
            <span class="summary-icon fail-icon">✗</span>
            <span class="summary-label">Failed</span>
          </td>
          <td class="py-2 px-3 border-b border-custom-border text-center">
            <span class="summary-count fail-count">${failed}</span>
          </td>
        </tr>
        <tr>
          <td class="py-2 px-3 border-b border-custom-border">
            <span class="summary-icon total-icon">•</span>
            <span class="summary-label">Total</span>
          </td>
          <td class="py-2 px-3 border-b border-custom-border text-center">
            <span class="summary-count total-count">${total}</span>
          </td>
        </tr>
      </tbody>
    </table>
  `;
  detailsMeta.appendChild(summaryDiv);

  const shots = run.artifacts?.screenshots || [];
 // Always show screenshots information, even if there are no screenshots
  const h = document.createElement("div");
  h.innerHTML = `<strong>Screenshots:</strong> ${shots.length}`;
  detailsMeta.appendChild(h);
  
  // Clear and organize screenshots better
 screenshotsDiv.innerHTML = "";
  screenshotsDiv.className = "shots"; // Ensure the CSS class is applied
  
  // Only create gallery and thumbnails if there are screenshots
  if (shots.length > 0) {
    // Create gallery data
    currentGalleryImages = [];
    
    // Sort screenshots to group related ones together (failure and 'all' screenshots)
    const sortedShots = [...shots].sort((a, b) => {
      // Extract test name without timestamp and suffix
      const getTestName = (name) => name.replace(/^[0-9]+_/, '').replace(/_(all|failure)\.png$/, '');
      const nameA = getTestName(a.name);
      const nameB = getTestName(b.name);
      
      // If test names are the same, put 'failure' screenshots first
      if (nameA === nameB) {
        return a.name.includes('failure') ? -1 : 1;
      }
      return nameA.localeCompare(nameB);
    });
    
    // Build gallery data array
    for (const s of sortedShots) {
      // Extract meaningful information from the filename
      const fileName = s.name || "Screenshot";
      const cleanName = fileName.replace(/^[0-9]+_/, ''); // Remove timestamp
      let testName = cleanName.replace(/\.png$/, ''); // Remove extension
      let screenshotType = "Test";
      
      // Determine if this is a failure or all screenshot
      if (testName.endsWith('_failure')) {
        screenshotType = "FAILURE";
        testName = testName.replace(/_failure$/, '');
      } else if (testName.endsWith('_all')) {
        screenshotType = "COMPLETE";
        testName = testName.replace(/_all$/, '');
      }
      
      // Convert underscores to spaces for readability
      testName = testName.replace(/_/g, ' ');
      
      currentGalleryImages.push({
        url: `${API ? API + s.url : s.url}`,
        description: `${screenshotType}: ${testName}`
      });
    }
    
    // Create thumbnail containers
    for (let i = 0; i < sortedShots.length; i++) {
      const s = sortedShots[i];
      
      const container = document.createElement("div");
      container.className = "screenshot-container";
      
      const img = document.createElement("img");
      img.src = `${API ? API + s.url : s.url}`;
      img.alt = s.name || "screenshot";
      img.title = s.name || "screenshot";
      
      // Add click handler to open gallery
      img.onclick = () => openGallery(i);
      
      // Create a detailed caption for the screenshot
      const caption = document.createElement("div");
      caption.className = "screenshot-caption";
      
      // Extract meaningful information from the filename
      const fileName = s.name || "Screenshot";
      const cleanName = fileName.replace(/^[0-9]+_/, ''); // Remove timestamp
      let testName = cleanName.replace(/\.png$/, ''); // Remove extension
      let screenshotType = "Test";
      
      // Determine if this is a failure or all screenshot
      if (testName.endsWith('_failure')) {
        screenshotType = "FAILURE";
        testName = testName.replace(/_failure$/, '');
      } else if (testName.endsWith('_all')) {
        screenshotType = "COMPLETE";
        testName = testName.replace(/_all$/, '');
      }
      
      // Convert underscores to spaces for readability
      testName = testName.replace(/_/g, ' ');
      
      caption.innerHTML = `<strong>${screenshotType}:</strong> ${testName}`;
      caption.title = `File: ${fileName}`;
      
      container.appendChild(img);
      container.appendChild(caption);
      screenshotsDiv.appendChild(container);
    }
 }

  // Add screenshotsDiv to detailsMeta before the report container
  detailsMeta.appendChild(screenshotsDiv);

  // Always display report information (after screenshots)
  const reportUrl = run.artifacts?.reportUrl || (run.id ? `/artifacts/runs/${run.id}/mochawesome-report/index.html` : '');
  const reportPath = run.artifacts?.reportPath || reportUrl;
  
  // Create container for both the iframe and the link
  const reportContainer = document.createElement("div");
  reportContainer.className = "report-container";
  
  // Create the iframe to embed the report
  const iframe = document.createElement("iframe");
  iframe.src = API ? API + reportUrl : reportUrl;
  iframe.style.width = "100%";
  iframe.style.height = "400px";
  iframe.style.border = "1px solid var(--border)";
  iframe.style.borderRadius = "8px";
  iframe.title = "Test Report";
  iframe.setAttribute("sandbox", "allow-same-origin allow-scripts allow-forms");
  iframe.style.maxWidth = "100%";
  iframe.style.maxHeight = "60vh";
  iframe.style.overflow = "auto";
  iframe.scrolling = "yes";
  
  // Create the link to open report in new tab
  const linkDiv = document.createElement("div");
  linkDiv.innerHTML = `<strong>Report:</strong> <a href="${API ? API + reportUrl : reportUrl}" target="_blank">View report in new tab</a>`;
  
  reportContainer.appendChild(linkDiv);
  reportContainer.appendChild(iframe);
  detailsMeta.appendChild(reportContainer);

  out.textContent = JSON.stringify(run, null, 2);
}

// Gallery functions
function openGallery(index) {
  if (currentGalleryImages.length === 0) return;
  
  currentGalleryIndex = index;
  const image = currentGalleryImages[index];
  
  document.getElementById("galleryImage").src = image.url;
  document.getElementById("galleryDescription").textContent = image.description;
  document.getElementById("galleryModal").style.display = "block";
}

function closeGallery() {
  document.getElementById("galleryModal").style.display = "none";
}

function showPrevImage() {
  if (currentGalleryImages.length === 0) return;
  
  currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
 const image = currentGalleryImages[currentGalleryIndex];
  
  document.getElementById("galleryImage").src = image.url;
  document.getElementById("galleryDescription").textContent = image.description;
}

function showNextImage() {
  if (currentGalleryImages.length === 0) return;
  
 currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
  const image = currentGalleryImages[currentGalleryIndex];
  
  document.getElementById("galleryImage").src = image.url;
  document.getElementById("galleryDescription").textContent = image.description;
}

// Set up gallery event listeners
document.getElementById("galleryClose").onclick = closeGallery;
document.getElementById("galleryPrev").onclick = showPrevImage;
document.getElementById("galleryNext").onclick = showNextImage;

// Close gallery when clicking outside the image
window.onclick = function(event) {
  const modal = document.getElementById("galleryModal");
  if (event.target === modal) {
    closeGallery();
  }
};

// Handle keyboard navigation for gallery
document.onkeydown = function(event) {
  if (document.getElementById("galleryModal").style.display === "block") {
    if (event.key === "Escape") {
      closeGallery();
      event.preventDefault(); // Prevent default behavior
    } else if (event.key === "ArrowLeft") {
      showPrevImage();
      event.preventDefault(); // Prevent default behavior (page scrolling)
    } else if (event.key === "ArrowRight") {
      showNextImage();
      event.preventDefault(); // Prevent default behavior (page scrolling)
    }
  }
};

async function refresh() {
  await loadScenarios();
  const r = await fetch(API ? `${API}/runs?limit=50` : `/runs?limit=50`);
  const j = await r.json();
  runsCache = j.runs || [];
 const filtered = applyFilters(runsCache);
  
  // Reset to first page when refreshing
  currentPage = 1;
  
  renderRuns(filtered);
  out.textContent = JSON.stringify({ runs: filtered }, null, 2);
  screenshotsDiv.innerHTML = "";
  screenshotsDiv.className = "shots"; // Ensure the CSS class is applied
  
  // Auto-select the first run if available and no run is currently selected
  if (filtered.length > 0) {
    const firstRun = filtered[0];
    
    // If no run was previously selected, or if the selected run is not in the current filtered list
    const selectedRunInFiltered = filtered.some(r => r.id === selectedRunId);
    if (!selectedRunId || !selectedRunInFiltered) {
      selectedRunId = firstRun.id;
      
      // Find and highlight the first row in the table
      const firstRow = runsTbody.querySelector("tr");
      if (firstRow) {
        // Remove selection from any previously selected row
        const prevSelected = runsTbody.querySelector("tr.selected");
        if (prevSelected) {
          prevSelected.classList.remove("selected");
        }
        
        firstRow.classList.add("selected");
      }
    }
    
    // Load details for the selected run (either first run or previously selected run that's still in the filtered list)
    const runToDisplay = filtered.find(r => r.id === selectedRunId) || firstRun;
    const details = await fetch(API ? `${API}/runs/${runToDisplay.id}` : `/runs/${runToDisplay.id}`).then(x => x.json());
    renderDetails(details);
  } else {
    // If no runs are available, clear the details panel
    detailsMeta.innerHTML = "";
    selectedRunId = null;
  }
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportJson() {
  const filtered = applyFilters(runsCache);
  downloadBlob("login-lab-runs.filtered.json", JSON.stringify({runs: filtered}, null, 2), "application/json");
}

function exportCsv() {
  const filtered = applyFilters(runsCache);
  const rows = [["id","scenario_id","type","status","started_at","finished_at","duration_ms","tests_count","failed_tests"]];
  for (const r of filtered) {
    const scenario = scenariosById[r.scenario_id];
    const stype = scenario?.type || "unknown";
    
    // Determine the number of tests to export
    let testsCount;
    if (r.selected_tests === null) {
      // If selected_tests is null, it means "Run all" was clicked, so show total tests in scenario
      testsCount = scenario?.tests?.length || 0;
    } else if (Array.isArray(r.selected_tests) && r.selected_tests.length > 0) {
      // If specific tests were selected, show the count of selected tests
      testsCount = r.selected_tests.length;
    } else {
      // Otherwise, show the count of tests from the run details (when available)
      testsCount = (r.details?.tests || []).length;
    }
    
    const failed = (r.details?.tests || []).filter(t => t.status === "fail").map(t => t.title).join("; ");
    rows.push([r.id, r.scenario_id, stype, r.status, r.started_at, r.finished_at, durationMs(r), testsCount, failed]);
  }
  const csv = rows.map(row =>
    row.map(v => {
      const s = String(v ?? "");
      return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s.replaceAll('"','""')}"` : s;
    }).join(",")
  ).join("\n");
  downloadBlob("login-lab-runs.filtered.csv", csv, "text/csv");
}

function jsonDiff(a, b, path="") {
  const diffs = [];
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

  if (Array.isArray(a) && Array.isArray(b)) {
    const max = Math.max(a.length, b.length);
    for (let i=0;i<max;i++) diffs.push(...jsonDiff(a[i], b[i], `${path}[${i}]`));
    return diffs;
  }

  if (isObj(a) && isObj(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) diffs.push(...jsonDiff(a[k], b[k], path ? `${path}.${k}` : k));
    return diffs;
  }

  if (a !== b) diffs.push({ path, a, b });
  return diffs;
}

async function diffRuns() {
  const aId = diffAEl.value.trim();
  const bId = diffBEl.value.trim();
  if (!aId || !bId) return alert("Enter two run ids to diff.");
  
  // Clear selection when doing diff
  const prevSelected = runsTbody.querySelector("tr.selected");
  if (prevSelected) {
    prevSelected.classList.remove("selected");
  }
  selectedRunId = null;
  
  const [a, b] = await Promise.all([
    fetch(API ? `${API}/runs/${aId}` : `/runs/${aId}`).then(x => x.json()),
    fetch(API ? `${API}/runs/${bId}` : `/runs/${bId}`).then(x => x.json())
  ]);
  const diffs = jsonDiff(a.details, b.details);
  out.textContent = JSON.stringify({ runA: aId, runB: bId, diffCount: diffs.length, diffs: diffs.slice(0, 500) }, null, 2);
   screenshotsDiv.innerHTML = "";
   screenshotsDiv.className = "shots"; // Ensure the CSS class is applied
   detailsMeta.innerHTML = "";
}

async function runTests(runAll) {
  const sid = scenarioSelect.value;
  if (!sid) return alert("Select a scenario");
  const selected = getSelectedTests();
  if (!runAll && selected.length === 0) return alert("Select tests or click Run all.");

  const payload = {
    scenario_id: sid,
    tests: runAll ? null : selected
  };

  const r = await fetch(API ? `${API}/runs` : '/runs', {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  const j = await r.json();
  out.textContent = JSON.stringify(j, null, 2);

  await refresh();
  let polls = 0;
  const poll = async () => {
    polls++;
    const latest = await fetch(API ? `${API}/runs/${j.id}` : `/runs/${j.id}`).then(x => x.json());
    if (latest) renderDetails(latest);
    if (latest && (latest.status === "queued" || latest.status === "running") && polls < 25) {
      setTimeout(poll, 800);
    } else {
      await refresh();
    }
  };
  setTimeout(poll, 800);
}

document.getElementById("refresh").onclick = refresh;
document.getElementById("runAllBtn").onclick = () => runTests(true);
document.getElementById("runSelectedBtn").onclick = () => runTests(false);

document.getElementById("exportJson").onclick = exportJson;
document.getElementById("exportCsv").onclick = exportCsv;
document.getElementById("diffBtn").onclick = diffRuns;

document.getElementById("deleteAllBtn").onclick = async () => {
  if (!confirm("Are you sure you want to delete ALL test runs and their associated screenshots and artifacts? This cannot be undone.")) {
    return;
  }
  
  try {
    const response = await fetch(API ? `${API}/runs` : '/runs', {
      method: "DELETE"
    });
    
    if (response.ok) {
      const result = await response.json();
      alert(`Successfully deleted all runs and cleaned up artifacts.\n${result.message}`);
      
      // Clear selection when runs are deleted
      const prevSelected = runsTbody.querySelector("tr.selected");
      if (prevSelected) {
        prevSelected.classList.remove("selected");
      }
      selectedRunId = null;
      
      await refresh(); // Refresh the UI to reflect the changes
    } else {
      const error = await response.text();
      alert(`Failed to delete runs: ${error}`);
    }
  } catch (err) {
    console.error("Error deleting runs:", err);
    alert(`Error deleting runs: ${err.message}`);
  }
};

document.getElementById("selectAll").onclick = () => {
  testsList.querySelectorAll("input[type='checkbox']").forEach(b => b.checked = true);
};
document.getElementById("selectNone").onclick = () => {
  testsList.querySelectorAll("input[type='checkbox']").forEach(b => b.checked = false);
};

scenarioSelect.onchange = () => { renderTestsForSelectedScenario(); currentPage = 1; refresh(); };
statusFilterEl.onchange = () => { currentPage = 1; refresh(); };
typeFilterEl.onchange = () => { currentPage = 1; refresh(); };

refresh();
