document.addEventListener("DOMContentLoaded", () => {
    // Ensure graphData is available (loaded from graph_data.js)
    if (typeof graphData === "undefined") {
        console.error("graphData is not defined. Make sure graph_data.js is loaded.");
        return;
    }

    // --- Pre-process graphData to propagate story associations ---
    const nodeStories = {};
    graphData.nodes.forEach(node => {
        nodeStories[node.id] = new Set();
        const idLower = node.id.toLowerCase();
        
        // Base seed rules
        if (idLower.startsWith("s1_") || idLower === "moon" || idLower === "sun" || idLower === "people" || idLower === "darkness" || idLower === "night" || idLower === "rejuvenation" || idLower === "sky") {
            nodeStories[node.id].add("story1");
        }
        if (idLower.startsWith("s2_") || idLower === "glara" || idLower === "woodpecker" || idLower === "flies" || idLower === "honey" || idLower === "carryingpole" || idLower === "flatdishes" || idLower === "whistlingmagic" || idLower === "flightability") {
            nodeStories[node.id].add("story2");
        }
        if (idLower.startsWith("s3_") || idLower === "woman" || idLower === "husband" || idLower === "children" || idLower === "fire" || idLower === "cookedfood" || idLower === "rawfood" || idLower === "campfiresite" || idLower === "thedarkness") {
            nodeStories[node.id].add("story3");
        }
        if (idLower.startsWith("s4_") || idLower === "elephant" || idLower === "aardvarkgirl" || idLower === "brothers" || idLower === "water" || idLower === "mud" || idLower === "urine" || idLower === "spears" || idLower === "rainmakingpower" || idLower === "secretwaterhole" || idLower === "forestbush" || idLower === "homecamp") {
            nodeStories[node.id].add("story4");
        }
    });

    // Propagate story associations through edges (union connected nodes' stories)
    for (let iter = 0; iter < 4; iter++) {
        graphData.edges.forEach(edge => {
            const fromStories = nodeStories[edge.from];
            const toStories = nodeStories[edge.to];
            if (fromStories && toStories) {
                fromStories.forEach(s => toStories.add(s));
                toStories.forEach(s => fromStories.add(s));
            }
        });
    }

    // --- State Variables ---
    let graph = null;
    let activeStories = new Set(["story1", "story2", "story3", "story4"]);
    let activeTypes = new Set(["Character", "Object", "MagicalAgent", "NarrativeFunction", "ProppianRole"]);
    let searchQuery = "";

    // --- DOM Elements ---
    const container = document.getElementById("network-container");
    const inspectorContent = document.getElementById("inspector-content");
    const searchInput = document.getElementById("search-input");
    const btnSearchClear = document.getElementById("btn-search-clear");
    const btnResetLayout = document.getElementById("btn-reset-layout");
    const btnHelpModal = document.getElementById("btn-help-modal");
    const helpModal = document.getElementById("help-modal");
    const closeModal = document.querySelector(".close-modal");
    const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
    const sidebarLeft = document.getElementById("sidebar-left");

    const statNodes = document.getElementById("stat-total-nodes");
    const statEdges = document.getElementById("stat-total-edges");

    // --- Color Configuration ---
    const nodeColors = {
        Character: "#10b981",       // Emerald green
        Object: "#06b6d4",          // Cyan
        MagicalAgent: "#ec4899",    // Pink
        NarrativeFunction: "#fbbf24", // Amber yellow
        ProppianRole: "#f97316"     // Orange
    };

    // Node Sizing
    const nodeSizes = {
        Character: 10,
        Object: 6,
        MagicalAgent: 8,
        NarrativeFunction: 7,
        ProppianRole: 6
    };

    // Edge Colors
    const edgeColors = {
        hasRole: "rgba(249, 115, 22, 0.6)",          // Orange
        performsFunction: "rgba(16, 185, 129, 0.6)",  // Emerald green
        lacks: "rgba(236, 72, 153, 0.6)",             // Pink
        follows: "rgba(251, 191, 36, 0.6)"            // Amber yellow
    };

    // --- Initialize 3D Graph ---
    function initGraph() {
        graph = ForceGraph3D()(container)
            .width(container.clientWidth)
            .height(container.clientHeight)
            .backgroundColor("rgba(0, 0, 0, 0)") // Transparent to show css gradient
            .showNavInfo(false)
            .nodeColor(node => nodeColors[node.type] || "#9ca3af")
            .nodeVal(node => nodeSizes[node.type] || 5)
            .nodeLabel(node => {
                const typeLabel = node.type.replace("_", " ");
                return `
                    <div class="tooltip-container">
                        <strong>${node.label}</strong>
                        <span class="tooltip-type" style="color: ${nodeColors[node.type] || '#fff'}; font-size: 10px; display: block; margin-top: 2px;">
                            ${typeLabel}
                        </span>
                    </div>
                `;
            })
            // Edge Configuration
            .linkColor(link => edgeColors[link.label] || "rgba(156, 163, 175, 0.4)")
            .linkWidth(link => link.label === "follows" ? 2.0 : 1.2)
            .linkDirectionalArrowLength(3.5)
            .linkDirectionalArrowRelPos(0.85)
            .linkDirectionalParticles(link => link.label === "follows" ? 3 : 0)
            .linkDirectionalParticleWidth(1.2)
            .linkDirectionalParticleSpeed(0.006)
            // Interactions
            .onNodeClick(node => {
                focusOnNode(node);
                showInspectorNode(node);
            })
            .onLinkClick(link => {
                showInspectorEdge(link);
            });

        // Initial Data Load
        updateGraph();

        // Adjust dimensions automatically when container size changes (e.g. sidebar toggle or window resize)
        if (typeof ResizeObserver !== "undefined") {
            const resizeObserver = new ResizeObserver(() => {
                if (graph) {
                    requestAnimationFrame(() => {
                        graph.width(container.clientWidth).height(container.clientHeight);
                    });
                }
            });
            resizeObserver.observe(container);
        } else {
            window.addEventListener("resize", () => {
                if (graph) {
                    graph.width(container.clientWidth).height(container.clientHeight);
                }
            });
        }
    }

    // --- Update Graph Data based on filters ---
    function updateGraph() {
        if (!graph) return;

        // 1. Filter Nodes
        const filteredNodes = graphData.nodes.filter(node => {
            // Check Type Filter
            if (!activeTypes.has(node.type)) return false;

            // Check Story Filter
            const stories = nodeStories[node.id];
            if (stories && stories.size > 0) {
                let hasActiveStory = false;
                stories.forEach(s => {
                    if (activeStories.has(s)) hasActiveStory = true;
                });
                if (!hasActiveStory) return false;
            } else if (activeStories.size === 0) {
                return false;
            }

            // Check Search Query
            if (searchQuery !== "") {
                const labelMatch = node.label.toLowerCase().includes(searchQuery);
                const idMatch = node.id.toLowerCase().includes(searchQuery);
                const typeMatch = node.type.toLowerCase().includes(searchQuery);
                
                let propMatch = false;
                if (node.properties) {
                    const propsString = JSON.stringify(node.properties).toLowerCase();
                    if (propsString.includes(searchQuery)) propMatch = true;
                }
                return labelMatch || idMatch || typeMatch || propMatch;
            }

            return true;
        });

        // 2. Filter Edges
        const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredEdges = graphData.edges.filter(edge => {
            return visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);
        });

        // 3. Update Statistics
        statNodes.textContent = filteredNodes.length;
        statEdges.textContent = filteredEdges.length;

        // 4. Bind to 3D graph (convert from/to keys to 3D Force Graph source/target)
        const formattedData = {
            nodes: filteredNodes.map(node => ({ ...node })),
            links: filteredEdges.map(edge => ({
                source: edge.from,
                target: edge.to,
                label: edge.label,
                id: `${edge.from}-${edge.to}-${edge.label}`
            }))
        };

        graph.graphData(formattedData);
    }

    // --- Smoothly focus camera on a clicked node ---
    function focusOnNode(node) {
        // Aim at node from outside it
        const distance = 90;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({x, y, z})
            1000  // transition duration in ms
        );
    }

    // --- Search handlers ---
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        btnSearchClear.style.display = searchQuery !== "" ? "block" : "none";
        updateGraph();

        // If there is only one match, focus on it
        const currentNodes = graph.graphData().nodes;
        if (currentNodes.length === 1) {
            focusOnNode(currentNodes[0]);
            showInspectorNode(currentNodes[0]);
        }
    });

    btnSearchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        btnSearchClear.style.display = "none";
        updateGraph();
        resetInspector();
    });

    // --- Story Checklist filters ---
    const storyCheckboxes = document.querySelectorAll(".story-checkbox");
    const storySelectAll = document.getElementById("story-select-all");

    storyCheckboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            if (cb.checked) {
                activeStories.add(cb.value);
            } else {
                activeStories.delete(cb.value);
            }
            const allChecked = Array.from(storyCheckboxes).every(c => c.checked);
            storySelectAll.checked = allChecked;
            storySelectAll.indeterminate = !allChecked && Array.from(storyCheckboxes).some(c => c.checked);
            updateGraph();
        });
    });

    storySelectAll.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        storyCheckboxes.forEach(cb => {
            cb.checked = isChecked;
            if (isChecked) {
                activeStories.add(cb.value);
            } else {
                activeStories.delete(cb.value);
            }
        });
        updateGraph();
    });

    // --- Node Type Visibility filters ---
    const typeCheckboxes = document.querySelectorAll(".type-checkbox");
    typeCheckboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            if (cb.checked) {
                activeTypes.add(cb.value);
            } else {
                activeTypes.delete(cb.value);
            }
            updateGraph();
        });
    });

    // --- Reset camera position ---
    btnResetLayout.addEventListener("click", () => {
        graph.zoomToFit(1000, 100);
    });

    // --- Sidebar Collapse/Expand Interaction ---
    if (btnToggleSidebar && sidebarLeft) {
        btnToggleSidebar.addEventListener("click", () => {
            sidebarLeft.classList.toggle("collapsed");
        });

        // Clicking a panel-section when collapsed automatically expands the sidebar
        const panelSections = sidebarLeft.querySelectorAll(".panel-section");
        panelSections.forEach(section => {
            section.addEventListener("click", (e) => {
                if (sidebarLeft.classList.contains("collapsed")) {
                    sidebarLeft.classList.remove("collapsed");
                    
                    // Focus on search input if search section was clicked
                    if (section.classList.contains("search-section")) {
                        setTimeout(() => searchInput.focus(), 150);
                    }
                }
            });
        });
    }

    // --- Help Modal Triggers ---
    btnHelpModal.addEventListener("click", () => {
        helpModal.style.display = "flex";
    });
    closeModal.addEventListener("click", () => {
        helpModal.style.display = "none";
    });
    window.addEventListener("click", (event) => {
        if (event.target === helpModal) {
            helpModal.style.display = "none";
        }
    });

    // --- Contextual Inspector Sidebars ---
    function resetInspector() {
        inspectorContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fa-solid fa-cube"></i>
                </div>
                <h3>Explore the Narrative</h3>
                <p>Click on any 3D node or connection in the graph to inspect its properties, Proppian analysis, and role definitions.</p>
                <div class="help-box">
                    <h4>3D Navigation:</h4>
                    <ul>
                        <li><strong>Left Click + Drag</strong>: Rotate camera in 3D.</li>
                        <li><strong>Scroll Wheel</strong>: Zoom in and out.</li>
                        <li><strong>Right Click + Drag</strong>: Pan graph.</li>
                        <li>Click on nodes to view metadata.</li>
                    </ul>
                </div>
            </div>
        `;
    }

    function showInspectorNode(node) {
        if (!node) return;
        const p = node.properties || {};
        let html = "";

        const badgeClass = `node-badge badge-${node.type.toLowerCase()}`;
        const typeLabel = node.type.replace("_", " ");

        html += `<div class="inspector-card">`;
        html += `<span class="${badgeClass}" style="background-color: ${nodeColors[node.type] || '#555'};">${typeLabel}</span>`;
        html += `<h2 class="card-title">${node.label}</h2>`;

        // Display description
        if (p.description || node.label !== node.id) {
            html += `
                <div class="info-item">
                    <span class="info-label">Description / Event</span>
                    <span class="info-value card-desc">${p.description || node.label}</span>
                </div>
            `;
        }

        // Custom details based on type
        if (node.type === "Character") {
            html += `
                <div class="info-item">
                    <span class="info-label">Namespace Entity</span>
                    <span class="info-value"><code>story:${node.id}</code></span>
                </div>
            `;
        } else if (node.type === "NarrativeFunction") {
            html += `
                <div class="info-item">
                    <span class="info-label">Namespace Entity</span>
                    <span class="info-value"><code>story:${node.id}</code></span>
                </div>
            `;
        } else if (node.type === "MagicalAgent") {
            html += `
                <div class="info-item">
                    <span class="info-label">Narrative Significance</span>
                    <span class="info-value card-desc">A supernatural tool, object, or skill required by characters to liquidate Lacks or complete imitation moves.</span>
                </div>
            `;
        } else if (node.type === "Object") {
            html += `
                <div class="info-item">
                    <span class="info-label">Narrative Significance</span>
                    <span class="info-value card-desc">Physical objects that are sought after, hoarded, or used to drive the plot sequence.</span>
                </div>
            `;
        } else if (node.type === "ProppianRole") {
            html += `
                <div class="info-item">
                    <span class="info-label">Universal Role definition</span>
                    <span class="info-value card-desc">A classic Proppian dramatis personae archetype adapted to the narrative domain.</span>
                </div>
            `;
        }

        // Other generic properties
        const skipProps = ["description", "label", "type", "id"];
        let hasOtherProps = false;
        let propsHtml = "";
        for (const [key, val] of Object.entries(p)) {
            if (skipProps.includes(key)) continue;
            hasOtherProps = true;
            propsHtml += `
                <div class="info-item">
                    <span class="info-label">${key}</span>
                    <span class="info-value">${val}</span>
                </div>
            `;
        }
        if (hasOtherProps) {
            html += propsHtml;
        }

        // Show connections dynamically
        const outbound = [];
        const inbound = [];
        graphData.edges.forEach(e => {
            if (e.from === node.id) {
                outbound.push(e);
            } else if (e.to === node.id) {
                inbound.push(e);
            }
        });

        if (outbound.length > 0) {
            html += `
                <div class="info-item">
                    <span class="info-label">Outbound Relations</span>
                    <span class="info-value">
                        ${outbound.map(e => `• <strong>${e.label}</strong> → <span class="node-link" data-id="${e.to}">${e.to}</span>`).join("<br>")}
                    </span>
                </div>
            `;
        }

        if (inbound.length > 0) {
            html += `
                <div class="info-item">
                    <span class="info-label">Inbound Relations</span>
                    <span class="info-value">
                        ${inbound.map(e => `• <span class="node-link" data-id="${e.from}">${e.from}</span> → <strong>${e.label}</strong>`).join("<br>")}
                    </span>
                </div>
            `;
        }

        html += `</div>`;
        inspectorContent.innerHTML = html;

        // Add event listeners to the inline node links
        document.querySelectorAll(".node-link").forEach(link => {
            link.addEventListener("click", (e) => {
                const targetId = e.target.getAttribute("data-id");
                // Find node object in active 3D force graph nodes
                const graphNode = graph.graphData().nodes.find(n => n.id === targetId);
                if (graphNode) {
                    focusOnNode(graphNode);
                    showInspectorNode(graphNode);
                }
            });
        });
    }

    function showInspectorEdge(edge) {
        if (!edge) return;
        const sourceId = edge.source.id || edge.source;
        const targetId = edge.target.id || edge.target;
        const sourceNode = graphData.nodes.find(n => n.id === sourceId);
        const targetNode = graphData.nodes.find(n => n.id === targetId);

        let html = `
            <div class="inspector-card">
                <span class="node-badge" style="background-color: var(--primary); box-shadow: 0 0 8px rgba(99,102,241,0.25);">Connection</span>
                <h3 class="card-title">${edge.label}</h3>
                
                <div class="info-item">
                    <span class="info-label">Source Node</span>
                    <span class="info-value"><strong>${sourceNode ? sourceNode.label : sourceId}</strong> <small>(${sourceNode ? sourceNode.type : ""})</small></span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Target Node</span>
                    <span class="info-value"><strong>${targetNode ? targetNode.label : targetId}</strong> <small>(${targetNode ? targetNode.type : ""})</small></span>
                </div>
            </div>
        `;
        inspectorContent.innerHTML = html;
    }

    // --- Night Sky & Fire Background Generator ---
    function initNightSky() {
        const starsContainer = document.getElementById("stars-container");
        const meteorsContainer = document.getElementById("meteors-container");
        const embersContainer = document.getElementById("embers-container");

        if (!starsContainer || !meteorsContainer || !embersContainer) return;

        // Generate Twinkling Stars
        const numStars = 65;
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement("div");
            star.className = "star";
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.top = `${Math.random() * 85}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.setProperty("--duration", `${Math.random() * 3 + 2}s`);
            star.style.setProperty("--base-opacity", `${Math.random() * 0.5 + 0.2}`);
            starsContainer.appendChild(star);
        }

        // Generate Meteors (Magic UI Style)
        const numMeteors = 14;
        for (let i = 0; i < numMeteors; i++) {
            const meteor = document.createElement("div");
            meteor.className = "meteor";
            meteor.style.top = `${Math.random() * 45 - 10}%`;
            meteor.style.left = `${Math.random() * 100}%`;
            meteor.style.setProperty("--delay", `${Math.random() * 9}s`);
            meteor.style.setProperty("--duration", `${Math.random() * 4 + 2.5}s`);
            meteor.style.setProperty("--angle", `${-200 - Math.random() * 30}deg`);
            meteorsContainer.appendChild(meteor);
        }

        // Generate Fire Embers
        const numEmbers = 28;
        const emberColors = ["#f97316", "#fbbf24", "#ef4444", "#fb923c"];
        for (let i = 0; i < numEmbers; i++) {
            const ember = document.createElement("div");
            ember.className = "ember";
            const size = Math.random() * 3 + 2;
            ember.style.left = `${Math.random() * 100}%`;
            ember.style.setProperty("--size", `${size}px`);
            ember.style.setProperty("--duration", `${Math.random() * 7 + 5}s`);
            ember.style.setProperty("--delay", `${Math.random() * 6}s`);
            ember.style.setProperty("--drift", `${(Math.random() - 0.5) * 90}px`);
            ember.style.setProperty("--ember-color", emberColors[Math.floor(Math.random() * emberColors.length)]);
            embersContainer.appendChild(ember);
        }
    }

    // --- Start App ---
    initNightSky();
    initGraph();
});
