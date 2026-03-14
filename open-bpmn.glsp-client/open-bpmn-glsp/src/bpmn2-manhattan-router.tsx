/********************************************************************************
 * Copyright (c) 2022 Imixs Software Solutions GmbH and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import {
    AbstractEdgeRouter,
    Bounds,
    DefaultAnchors,
    GRoutableElement,
    GRoutingHandle,
    LinearRouteOptions,
    Point,
    ResolvedHandleMove,
    RoutedPoint,
    Side
} from '@eclipse-glsp/client';
import { injectable } from 'inversify';

export interface BPMN2RouterOptions extends LinearRouteOptions {
    standardDistance: number;
}

/**
 * BPMN2ManhattanRouter - A custom Manhattan Edge Router for BPMN diagrams.
 *
 * Design principles:
 *
 * 1. route() is a pure rendering function — it never writes to edge.routingPoints.
 *    It reads edge.routingPoints and returns a full RoutedPoint[] for rendering.
 *
 * 2. createRoutedCorners() computes intermediate corner points. Two cases:
 *    - Existing routing points: filter BPMN anchors, detect element movement,
 *      apply "follow element" logic or addAdditionalCorner accordingly.
 *    - No routing points: calculate default corners from source/target geometry.
 *
 * 3. Element movement detection: edgeElementPositions stores the last known
 *    source/target bounds per edge. If bounds changed → elementMoved=true →
 *    nearest corner follows the element via Bounds.center().
 *    If bounds unchanged → handle drag → addAdditionalCorner runs instead.
 *
 * 4. BPMN files store source/target anchors as first/last waypoint.
 *    These are filtered out in createRoutedCorners before processing.
 */
@injectable()
export class BPMN2ManhattanRouter extends AbstractEdgeRouter {

    static readonly KIND = 'manhattan';

    // Set to true to enable verbose logging
    private debugMode: boolean = false;

    // Stores the last known source/target positions per edge.
    // Used to detect element movement vs. handle drags.
    private edgeElementPositions: Map<string, {
        sourceX: number, sourceY: number,
        targetX: number, targetY: number
    }> = new Map();

    get kind(): string {
        return BPMN2ManhattanRouter.KIND;
    }

    protected getOptions(edge: GRoutableElement): BPMN2RouterOptions {
        return {
            standardDistance: 20,
            minimalPointDistance: 20,
            selfEdgeOffset: 0.25
        };
    }

    // ──────────────────────────────────────────────
    // Core routing
    // ──────────────────────────────────────────────

    /**
     * Main entry point called by the framework on every render cycle.
     *
     * Returns the full RoutedPoint[] array for rendering:
     *   [source-anchor, ...corners, target-anchor]
     *
     * This method is a pure rendering function — it NEVER writes to
     * edge.routingPoints. Only commitRoute() and applyInnerHandleMoves()
     * are allowed to modify edge.routingPoints.
     */
    override route(edge: GRoutableElement): RoutedPoint[] {
        if (!edge.source || !edge.target) {
            return [];
        }
        if (!edge.source.bounds || !edge.target.bounds) {
            return [];
        }

        const routedCorners = this.createRoutedCorners(edge);

        // Use first/last corner as reference point for anchor computation.
        // If there are no corners (direct connection), use the center of the
        // opposite element as reference.
        const sourceRefPoint = routedCorners[0] ?? Bounds.center(edge.target.bounds);
        const targetRefPoint = routedCorners[routedCorners.length - 1] ?? Bounds.center(edge.source.bounds);

        const sourceAnchor = this.getTranslatedAnchor(
            edge.source, sourceRefPoint, edge.parent, edge, edge.sourceAnchorCorrection
        );
        const targetAnchor = this.getTranslatedAnchor(
            edge.target, targetRefPoint, edge.parent, edge, edge.targetAnchorCorrection
        );

        if (!sourceAnchor || !targetAnchor) {
            this.debug(`route() edge=${edge.id} → no valid anchors`);
            return [];
        }

        const result: RoutedPoint[] = [];
        result.push({ kind: 'source', ...sourceAnchor });
        routedCorners.forEach(corner => result.push(corner));
        result.push({ kind: 'target', ...targetAnchor });

        this.debug(`route() edge=${edge.id} corners=${routedCorners.length} existingPoints=${edge.routingPoints.length}`);
        this.debugPoints('  result', result);
        return result;
    }

    /**
     * Computes the intermediate corner points for the route.
     *
     * Two cases:
     *
     * Case 1 — Existing routing points (edge.routingPoints.length > 0):
     *   a) Filter out BPMN source/target anchor waypoints (first/last point
     *      inside element bounds).
     *   b) Detect if source or target element has moved since last render.
     *   c) If element moved → apply "follow" logic to adjust nearest corners.
     *      The follow logic handles all adjustments — addAdditionalCorner is NOT
     *      called in this case to avoid inserting unwanted bend points.
     *   d) If element did NOT move (handle drag) → call addAdditionalCorner to
     *      insert new bend points if routing points are outside element bounds.
     *   e) Always call manhattanify() to fix diagonal segments.
     *
     * Case 2 — No routing points:
     *   Calculate default corners from source/target geometry.
     *
     * Never writes to edge.routingPoints.
     */
    protected createRoutedCorners(edge: GRoutableElement): RoutedPoint[] {
        const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, 'source');
        const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, 'target');

        if (edge.routingPoints && edge.routingPoints.length > 0) {
            const points: Point[] = edge.routingPoints.map(rp => ({ x: rp.x, y: rp.y }));

            // Step 1: Remove BPMN source/target anchor waypoints.
            // BPMN files store the source anchor as the first waypoint and the
            // target anchor as the last waypoint. These are recomputed by
            // getTranslatedAnchor() in route() and must not be treated as corners.
            while (points.length > 0 && Bounds.includes(sourceAnchors.bounds, points[0])) {
                this.debug(`createRoutedCorners: removing source-anchor waypoint x=${points[0].x} y=${points[0].y}`);
                points.shift();
            }
            while (points.length > 0 && Bounds.includes(targetAnchors.bounds, points[points.length - 1])) {
                this.debug(`createRoutedCorners: removing target-anchor waypoint x=${points[points.length - 1].x} y=${points[points.length - 1].y}`);
                points.pop();
            }

            if (points.length > 0) {
                // Step 2: Detect if source or target element has moved.
                // Compare current element bounds with last known positions.
                // This distinguishes element movement from handle drags:
                //   - Element moved   → elementMoved=true  → follow corner logic
                //   - Handle dragged  → element unchanged  → addAdditionalCorner
                const srcBounds = edge.source!.bounds;
                const tgtBounds = edge.target!.bounds;
                const lastPos = this.edgeElementPositions.get(edge.id);
                const elementMoved = !lastPos
                    || lastPos.sourceX !== srcBounds.x
                    || lastPos.sourceY !== srcBounds.y
                    || lastPos.targetX !== tgtBounds.x
                    || lastPos.targetY !== tgtBounds.y;

                // Always update stored positions for next render cycle
                this.edgeElementPositions.set(edge.id, {
                    sourceX: srcBounds.x, sourceY: srcBounds.y,
                    targetX: tgtBounds.x, targetY: tgtBounds.y
                });

                // *** DEBUG ***
                this.debug(`createRoutedCorners edge=${edge.id} elementMoved=${elementMoved} src=(${srcBounds.x},${srcBounds.y}) tgt=(${tgtBounds.x},${tgtBounds.y})`);
                if (lastPos) {
                    this.debug(`  lastPos src=(${lastPos.sourceX},${lastPos.sourceY}) tgt=(${lastPos.targetX},${lastPos.targetY})`);
                }

                if (elementMoved) {
                    // Step 3a: Element moved → adjust nearest corners to follow.
                    // The corner adjacent to the moved element slides along its
                    // axis to keep the route orthogonal.
                    // addAdditionalCorner is NOT called here — the follow logic
                    // already ensures orthogonality and calling addAdditionalCorner
                    // afterwards would incorrectly insert extra bend points.
                    const sourceAnchor = this.getTranslatedAnchor(
                        edge.source!, points[0], edge.parent, edge, edge.sourceAnchorCorrection
                    );
                    const targetAnchor = this.getTranslatedAnchor(
                        edge.target!, points[points.length - 1], edge.parent, edge, edge.targetAnchorCorrection
                    );

                    if (sourceAnchor && targetAnchor) {
                        if (points.length === 1) {
                            const isVertical = Math.abs(points[0].x - sourceAnchor.x) < 5;
                            if (isVertical) {
                                // Vertical first segment → corner x stays, corner y follows target center
                                points[0] = {
                                    x: sourceAnchor.x,
                                    y: Math.round(Bounds.center(edge.target!.bounds).y)
                                };
                            } else {
                                // Horizontal first segment → corner y stays, corner x follows target center
                                points[0] = {
                                    x: Math.round(Bounds.center(edge.target!.bounds).x),
                                    y: sourceAnchor.y
                                };
                            }
                        } else {
                            const isFirstVertical = Math.abs(points[0].x - points[1].x) < 1;
                            if (isFirstVertical) {
                                points[0] = {
                                    x: points[0].x,
                                    y: Math.round(Bounds.center(edge.source!.bounds).y)
                                };
                            } else {
                                points[0] = {
                                    x: Math.round(Bounds.center(edge.source!.bounds).x),
                                    y: points[0].y
                                };
                            }
                            const last = points.length - 1;
                            const isLastVertical = Math.abs(points[last].x - points[last - 1].x) < 1;
                            if (isLastVertical) {
                                points[last] = {
                                    x: points[last].x,
                                    y: Math.round(Bounds.center(edge.target!.bounds).y)
                                };
                            } else {
                                points[last] = {
                                    x: Math.round(Bounds.center(edge.target!.bounds).x),
                                    y: points[last].y
                                };
                            }
                        }
                    }
                    // *** NEU: Write back adjusted points so subsequent route() calls
                    // in the same frame see the updated corners, not the old values.
                    // Without this, addAdditionalCorner would incorrectly fire on the
                    // second call because edge.routingPoints still has the old position.
                    edge.routingPoints = points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));

                } else {
                    // Step 3b: Element did NOT move → user is dragging a handle.
                    // Insert additional corners if routing points lie outside
                    // element bounds due to the handle drag.
                    this.addAdditionalCorner(points, sourceAnchors, targetAnchors);
                    this.addAdditionalCorner(points, targetAnchors, sourceAnchors);
                }

                // Step 4: Fix any remaining diagonal segments.
                this.manhattanify(points);

                return points.map((rp, index) => ({
                    kind: 'linear' as const,
                    pointIndex: index,
                    x: Math.round(rp.x),
                    y: Math.round(rp.y)
                }));
            }
        }

        // Case 2: No routing points → calculate default corners.
        const options = this.getOptions(edge);
        const bestAnchors = this.getBestConnectionAnchors(sourceAnchors, targetAnchors, options);
        this.debug(`  createRoutedCorners: default source=${bestAnchors.source} target=${bestAnchors.target}`);
        const corners = this.calculateCorners(sourceAnchors, targetAnchors, bestAnchors, options);

        return corners.map((corner, index) => ({
            kind: 'linear' as const,
            pointIndex: index,
            x: Math.round(corner.x),
            y: Math.round(corner.y)
        }));
    }

    /**
     * Inserts an additional corner point if the first/last routing point lies
     * outside the element bounds in the direction of the adjacent segment.
     *
     * Called only when the user drags a routing handle (elementMoved=false).
     * When an element moves, the "follow" logic in createRoutedCorners handles
     * orthogonality instead.
     *
     * Example — handle dragged so corner ends up outside target bounds:
     *   corner (600, 180), target at x=452..488
     *   → corner.x=600 > target.right=488 → segment is horizontal
     *   → insert new point (600, target.centerY)
     *   → manhattanify creates clean orthogonal bend
     *
     * @param points         Routing points array (modified in place)
     * @param currentAnchors Anchors of the element on this side (source or target)
     * @param otherAnchors   Anchors of the element on the other side
     */
    protected addAdditionalCorner(
        points: Point[],
        currentAnchors: DefaultAnchors,
        otherAnchors: DefaultAnchors
    ): void {
        if (points.length === 0) {
            return;
        }

        const isSource = currentAnchors.kind === 'source';
        const refPoint = isSource ? points[0] : points[points.length - 1];
        const insertIndex = isSource ? 0 : points.length;

        // Determine the direction of the segment adjacent to this element.
        // isHorizontal=true means the segment is vertical (same x),
        // so we check whether refPoint.y is outside the element's y bounds.
        let isHorizontal: boolean;
        if (points.length > 1) {
            if (isSource) {
                isHorizontal = Math.abs(points[0].x - points[1].x) < 1;
            } else {
                isHorizontal = Math.abs(points[points.length - 1].x - points[points.length - 2].x) < 1;
            }
        } else {
            // Single point: infer orientation from nearest side of other element
            const nearestSide = otherAnchors.getNearestSide(refPoint);
            isHorizontal = nearestSide === Side.TOP || nearestSide === Side.BOTTOM;
        }

        if (isHorizontal) {
            // Adjacent segment is vertical (same x).
            // Check if refPoint.y is outside the element's y bounds.
            const topY = currentAnchors.get(Side.TOP).y;
            const bottomY = currentAnchors.get(Side.BOTTOM).y;
            if (refPoint.y < topY || refPoint.y > bottomY) {
                const newPoint: Point = {
                    x: currentAnchors.get(Side.TOP).x,
                    y: refPoint.y
                };
                this.debug(`addAdditionalCorner (${currentAnchors.kind}): inserting at x=${newPoint.x} y=${newPoint.y}`);
                points.splice(insertIndex, 0, newPoint);
            }
        } else {
            // Adjacent segment is horizontal (same y).
            // Check if refPoint.x is outside the element's x bounds.
            const leftX = currentAnchors.get(Side.LEFT).x;
            const rightX = currentAnchors.get(Side.RIGHT).x;
            if (refPoint.x < leftX || refPoint.x > rightX) {
                const newPoint: Point = {
                    x: refPoint.x,
                    y: currentAnchors.get(Side.LEFT).y
                };
                this.debug(`addAdditionalCorner (${currentAnchors.kind}): inserting at x=${newPoint.x} y=${newPoint.y}`);
                points.splice(insertIndex, 0, newPoint);
            }
        }
    }

    /**
     * Ensures all segments are strictly orthogonal (horizontal or vertical).
     * For any diagonal segment, inserts an intermediate corner point to make
     * it orthogonal. Uses the x of the previous point and y of the next point
     * as the intermediate corner.
     */
    protected manhattanify(points: Point[]): void {
        for (let i = 1; i < points.length; i++) {
            const isVertical = Math.abs(points[i - 1].x - points[i].x) < 1;
            const isHorizontal = Math.abs(points[i - 1].y - points[i].y) < 1;
            if (!isVertical && !isHorizontal) {
                this.debug(`manhattanify: fixing diagonal at index=${i}`);
                points.splice(i, 0, { x: points[i - 1].x, y: points[i].y });
                i++;
            }
        }
    }

    /**
     * Determines the best sides (TOP/BOTTOM/LEFT/RIGHT) on source and target
     * to connect a new edge. Evaluated in priority order:
     *   1. Direct connections (0 corners needed)
     *   2. One-corner connections
     *   3. Two-corner connections (fallback)
     */
    protected getBestConnectionAnchors(
        sourceAnchors: DefaultAnchors,
        targetAnchors: DefaultAnchors,
        options: BPMN2RouterOptions
    ): { source: Side, target: Side } {
        const sd = options.standardDistance;

        // Direct connections (0 corners) ─────────────────────────────────
        if (targetAnchors.get(Side.LEFT).x - sourceAnchors.get(Side.RIGHT).x > sd) {
            return { source: Side.RIGHT, target: Side.LEFT };
        }
        if (sourceAnchors.get(Side.LEFT).x - targetAnchors.get(Side.RIGHT).x > sd) {
            return { source: Side.LEFT, target: Side.RIGHT };
        }
        if (sourceAnchors.get(Side.TOP).y - targetAnchors.get(Side.BOTTOM).y > sd) {
            return { source: Side.TOP, target: Side.BOTTOM };
        }
        if (targetAnchors.get(Side.TOP).y - sourceAnchors.get(Side.BOTTOM).y > sd) {
            return { source: Side.BOTTOM, target: Side.TOP };
        }

        // One-corner connections ──────────────────────────────────────────
        if (targetAnchors.get(Side.TOP).x - sourceAnchors.get(Side.RIGHT).x > 0.5 * sd
            && targetAnchors.get(Side.TOP).y - sourceAnchors.get(Side.RIGHT).y > sd) {
            return { source: Side.RIGHT, target: Side.TOP };
        }
        if (targetAnchors.get(Side.BOTTOM).x - sourceAnchors.get(Side.RIGHT).x > 0.5 * sd
            && sourceAnchors.get(Side.RIGHT).y - targetAnchors.get(Side.BOTTOM).y > sd) {
            return { source: Side.RIGHT, target: Side.BOTTOM };
        }
        if (sourceAnchors.get(Side.LEFT).x - targetAnchors.get(Side.BOTTOM).x > 0.5 * sd
            && sourceAnchors.get(Side.LEFT).y - targetAnchors.get(Side.BOTTOM).y > sd) {
            return { source: Side.LEFT, target: Side.BOTTOM };
        }
        if (sourceAnchors.get(Side.LEFT).x - targetAnchors.get(Side.TOP).x > 0.5 * sd
            && targetAnchors.get(Side.TOP).y - sourceAnchors.get(Side.LEFT).y > sd) {
            return { source: Side.LEFT, target: Side.TOP };
        }
        if (targetAnchors.get(Side.RIGHT).y - sourceAnchors.get(Side.BOTTOM).y > 0.5 * sd
            && sourceAnchors.get(Side.BOTTOM).x - targetAnchors.get(Side.RIGHT).x > sd) {
            return { source: Side.BOTTOM, target: Side.RIGHT };
        }
        if (targetAnchors.get(Side.LEFT).y - sourceAnchors.get(Side.BOTTOM).y > 0.5 * sd
            && targetAnchors.get(Side.LEFT).x - sourceAnchors.get(Side.BOTTOM).x > sd) {
            return { source: Side.BOTTOM, target: Side.LEFT };
        }

        // Two-corner connections (fallback) ───────────────────────────────
        const srcTop = sourceAnchors.get(Side.TOP);
        const tgtTop = targetAnchors.get(Side.TOP);
        if (!Bounds.includes(targetAnchors.bounds, srcTop)
            && !Bounds.includes(sourceAnchors.bounds, tgtTop)) {
            return { source: Side.TOP, target: Side.TOP };
        }
        const srcRight = sourceAnchors.get(Side.RIGHT);
        const tgtRight = targetAnchors.get(Side.RIGHT);
        if (!Bounds.includes(targetAnchors.bounds, srcRight)
            && !Bounds.includes(sourceAnchors.bounds, tgtRight)) {
            return { source: Side.RIGHT, target: Side.RIGHT };
        }

        // Default fallback
        return { source: Side.RIGHT, target: Side.LEFT };
    }

    /**
     * Calculates the corner points for a new default route between two sides.
     * Returns 0, 1 or 2 corner points depending on the relative geometry of
     * source and target.
     */
    protected calculateCorners(
        sourceAnchors: DefaultAnchors,
        targetAnchors: DefaultAnchors,
        sides: { source: Side, target: Side },
        options: BPMN2RouterOptions
    ): Point[] {
        const src = sourceAnchors.get(sides.source);
        const tgt = targetAnchors.get(sides.target);
        const sd = options.standardDistance;

        switch (sides.source) {
            case Side.RIGHT:
                switch (sides.target) {
                    case Side.LEFT: {
                        if (src.y !== tgt.y) {
                            const midX = Math.round((src.x + tgt.x) / 2);
                            return [{ x: midX, y: src.y }, { x: midX, y: tgt.y }];
                        }
                        return [];
                    }
                    case Side.TOP: {
                        return [{ x: tgt.x, y: src.y }];
                    }
                    case Side.BOTTOM: {
                        return [{ x: tgt.x, y: src.y }];
                    }
                    case Side.RIGHT: {
                        const maxX = Math.round(Math.max(src.x, tgt.x) + 1.5 * sd);
                        return [{ x: maxX, y: src.y }, { x: maxX, y: tgt.y }];
                    }
                }
                break;

            case Side.LEFT:
                switch (sides.target) {
                    case Side.RIGHT: {
                        if (src.y !== tgt.y) {
                            const midX = Math.round((src.x + tgt.x) / 2);
                            return [{ x: midX, y: src.y }, { x: midX, y: tgt.y }];
                        }
                        return [];
                    }
                    case Side.TOP: {
                        return [{ x: tgt.x, y: src.y }];
                    }
                    case Side.BOTTOM: {
                        return [{ x: tgt.x, y: src.y }];
                    }
                    default: {
                        const minX = Math.round(Math.min(src.x, tgt.x) - 1.5 * sd);
                        return [{ x: minX, y: src.y }, { x: minX, y: tgt.y }];
                    }
                }

            case Side.TOP:
                switch (sides.target) {
                    case Side.BOTTOM: {
                        if (src.x !== tgt.x) {
                            const midY = Math.round((src.y + tgt.y) / 2);
                            return [{ x: src.x, y: midY }, { x: tgt.x, y: midY }];
                        }
                        return [];
                    }
                    case Side.TOP: {
                        const minY = Math.round(Math.min(src.y, tgt.y) - 1.5 * sd);
                        return [{ x: src.x, y: minY }, { x: tgt.x, y: minY }];
                    }
                    case Side.RIGHT: {
                        return [{ x: src.x, y: tgt.y }];
                    }
                    case Side.LEFT: {
                        return [{ x: src.x, y: tgt.y }];
                    }
                }
                break;

            case Side.BOTTOM:
                switch (sides.target) {
                    case Side.TOP: {
                        if (src.x !== tgt.x) {
                            const midY = Math.round((src.y + tgt.y) / 2);
                            return [{ x: src.x, y: midY }, { x: tgt.x, y: midY }];
                        }
                        return [];
                    }
                    case Side.BOTTOM: {
                        const maxY = Math.round(Math.max(src.y, tgt.y) + 1.5 * sd);
                        return [{ x: src.x, y: maxY }, { x: tgt.x, y: maxY }];
                    }
                    case Side.RIGHT: {
                        return [{ x: src.x, y: tgt.y }];
                    }
                    case Side.LEFT: {
                        return [{ x: src.x, y: tgt.y }];
                    }
                }
                break;
        }

        // Fallback: direct midpoint connection
        const midX = Math.round((src.x + tgt.x) / 2);
        return [{ x: midX, y: src.y }, { x: midX, y: tgt.y }];
    }

    // ──────────────────────────────────────────────
    // Handle management
    // ──────────────────────────────────────────────

    /**
     * Called when the user selects an edge to show routing handles.
     * commitRoute() filters out source/target anchors from the routed points
     * and stores only the linear corner points in edge.routingPoints.
     */
    override createRoutingHandles(edge: GRoutableElement): void {
        const routedPoints = this.route(edge);
        this.debug(`createRoutingHandles edge=${edge.id} (${routedPoints.length} points)`);
        this.debugPoints('  routedPoints', routedPoints);
        this.commitRoute(edge, routedPoints);
        this.debug(`  after commitRoute: routingPoints=${edge.routingPoints.length}`);
        this.debugPoints('  routingPoints', edge.routingPoints);
        if (routedPoints.length > 0) {
            this.addHandle(edge, 'source', 'routing-point', -2);
            for (let i = 0; i < routedPoints.length - 1; i++) {
                this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', i - 1);
            }
            this.addHandle(edge, 'target', 'routing-point', routedPoints.length - 2);
        }
    }

    /**
     * Returns the visual position of an inner routing handle (midpoint of segment).
     */
    override getInnerHandlePosition(
        edge: GRoutableElement,
        route: RoutedPoint[],
        handle: GRoutingHandle): Point | undefined {
        if (handle.kind === 'manhattan-50%') {
            const { start, end } = this.findRouteSegment(edge, route, handle.pointIndex);
            if (start !== undefined && end !== undefined) {
                return Point.linear(start, end, 0.5);
            }
        }
        return undefined;
    }

    /**
     * Called while the user drags a routing handle.
     *
     * Sets isHandleDragging=true to prevent the "follow element" logic in
     * createRoutedCorners from overriding the manual handle move.
     *
     * For manhattan-50% handles, only the orthogonal axis of the segment is
     * adjusted — horizontal segments move in Y, vertical segments move in X.
     */
    override applyInnerHandleMoves(
        edge: GRoutableElement,
        moves: ResolvedHandleMove[]
    ): void {
        this.debug(`applyInnerHandleMoves edge=${edge.id} moves=${moves.length}`);
        moves.forEach(move => {
            this.debug(`  handle kind=${move.handle.kind} index=${move.handle.pointIndex} to=${move.toPosition.x},${move.toPosition.y}`);
        });

        // Signal to createRoutedCorners: do not override routing points
        // with the "follow element" logic while handle is being dragged.
        const route = this.route(edge);
        const routingPoints = edge.routingPoints;

        moves.forEach(move => {
            const handle = move.handle;
            const index = handle.pointIndex;

            if (handle.kind === 'manhattan-50%') {
                if (index < 0) {
                    // Handle is before the first routing point (first segment)
                    if (routingPoints.length === 0) {
                        routingPoints.push({ x: move.toPosition.x, y: move.toPosition.y });
                        handle.pointIndex = 0;
                    } else if (this.isVerticalSegment(route[0], route[1])) {
                        this.alignX(routingPoints, 0, move.toPosition.x);
                    } else {
                        this.alignY(routingPoints, 0, move.toPosition.y);
                    }
                } else if (index < routingPoints.length - 1) {
                    // Handle is between two routing points (inner segment)
                    if (this.isVerticalSegment(routingPoints[index], routingPoints[index + 1])) {
                        this.alignX(routingPoints, index, move.toPosition.x);
                        this.alignX(routingPoints, index + 1, move.toPosition.x);
                    } else {
                        this.alignY(routingPoints, index, move.toPosition.y);
                        this.alignY(routingPoints, index + 1, move.toPosition.y);
                    }
                } else {
                    // Handle is after the last routing point (last segment)
                    const last = route.length - 1;
                    if (this.isVerticalSegment(route[last - 1], route[last])) {
                        this.alignX(routingPoints, routingPoints.length - 1, move.toPosition.x);
                    } else {
                        this.alignY(routingPoints, routingPoints.length - 1, move.toPosition.y);
                    }
                }
                this.debugPoints('  routingPoints after move', routingPoints);
            }
        });

    }

    // ──────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────

    protected isVerticalSegment(p1: Point, p2: Point): boolean {
        return Math.abs(p1.x - p2.x) < Math.abs(p1.y - p2.y);
    }

    protected alignX(points: Point[], index: number, x: number): void {
        if (index >= 0 && index < points.length) {
            points[index] = { x, y: points[index].y };
        }
    }

    protected alignY(points: Point[], index: number, y: number): void {
        if (index >= 0 && index < points.length) {
            points[index] = { x: points[index].x, y };
        }
    }

    // ──────────────────────────────────────────────
    // Debug methods
    // ──────────────────────────────────────────────

    protected debug(message: string): void {
        if (this.debugMode) {
            console.log('├── ' + message);
        }
    }

    protected debugPoints(label: string, points: { x: number; y: number; kind?: string }[]): void {
        if (this.debugMode) {
            console.log('│   ├── ' + label + ' (' + points.length + ')');
            points.forEach((p, i) => {
                const kind = 'kind' in p ? ` kind=${p.kind}` : '';
                console.log(`│   │   ├── [${i}]${kind} x=${p.x} y=${p.y}`);
            });
        }
    }
}
