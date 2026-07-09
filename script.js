document.addEventListener("DOMContentLoaded", () => {
    // Ensure graphData is available (loaded from graph_data.js)
    if (typeof graphData === "undefined") {
        console.error("graphData is not defined. Make sure graph_data.js is loaded.");
        return;
    }

    // --- State Variables ---
    let graph = null;
    let activeStories = new Set(["honey_flies"]);
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

        // Adjust dimensions on window resize
        window.addEventListener("resize", () => {
            if (graph) {
                graph.width(container.clientWidth).height(container.clientHeight);
            }
        });
    }

    // --- Update Graph Data based on filters ---
    function updateGraph() {
        if (!graph) return;

        // 1. Filter Nodes
        const filteredNodes = graphData.nodes.filter(node => {
            // Check Type Filter
            if (!activeTypes.has(node.type)) return false;

            // Check Story Filter (Story is always honey_flies here)
            if (activeStories.size === 0) return false;

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

    // --- Start App ---
    initGraph();
});
