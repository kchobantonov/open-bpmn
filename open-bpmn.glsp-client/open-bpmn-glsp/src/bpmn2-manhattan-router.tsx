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

@injectable()
export class BPMN2ManhattanRouter extends AbstractEdgeRouter {

    static readonly KIND = 'manhattan';

    // Set to true to enable verbose logging of route() calls
    private debugMode: boolean = true;

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
     * Main entry point. Calculates the full routed points array
     * (source anchor + corners + target anchor) for rendering.
     * Never writes to edge.routingPoints directly.
     */
    override route(edge: GRoutableElement): RoutedPoint[] {
        if (!edge.source || !edge.target) {
            return [];
        }
        if (!edge.source.bounds || !edge.target.bounds) {
            return [];
        }

        const routedCorners = this.createRoutedCorners(edge);

        // Use first/last corner as reference point for anchor computation
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
     * Creates the intermediate corner points.
     * If edge.routingPoints exist → use them (+ manhattanify).
     * Otherwise → calculate default corners from source/target geometry.
     * Never writes to edge.routingPoints.
     */
    protected createRoutedCorners(edge: GRoutableElement): RoutedPoint[] {
        const sourceAnchors = new DefaultAnchors(edge.source!, edge.parent, 'source');
        const targetAnchors = new DefaultAnchors(edge.target!, edge.parent, 'target');

        // Case 1: existing routing points → use and fix them
        if (edge.routingPoints && edge.routingPoints.length > 0) {
            const points: Point[] = edge.routingPoints.map(rp => ({ x: rp.x, y: rp.y }));
            this.manhattanify(points);
            return points.map((rp, index) => ({
                kind: 'linear' as const,
                pointIndex: index,
                x: rp.x,
                y: rp.y
            }));
        }

        // Case 2: no routing points → calculate default corners
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
     * Ensures all segments are orthogonal (horizontal or vertical).
     * Inserts an intermediate point for any diagonal segment.
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
     * to connect the edge. Tries direct connections first, then one-corner,
     * then two-corner fallbacks.
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
     * Calculates the corner points for a route between two sides.
     * Returns 0, 1 or 2 corner points depending on the geometry.
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

        // Fallback
        const midX = Math.round((src.x + tgt.x) / 2);
        return [{ x: midX, y: src.y }, { x: midX, y: tgt.y }];
    }

    // ──────────────────────────────────────────────
    // Handle management
    // ──────────────────────────────────────────────

    /**
     * Called when the user selects an edge to show routing handles.
     * Always logged — only triggered on interaction, never noisy.
     */
    override createRoutingHandles(edge: GRoutableElement): void {
        const routedPoints = this.route(edge);
        console.log(`createRoutingHandles edge=${edge.id} (${routedPoints.length} points)`);
        routedPoints.forEach((p, i) =>
            console.log(`  [${i}] kind=${p.kind} x=${p.x} y=${p.y}`)
        );
        this.commitRoute(edge, routedPoints);
        console.log(`  after commitRoute: routingPoints=${edge.routingPoints.length}`);
        edge.routingPoints.forEach((p, i) =>
            console.log(`  [${i}] x=${p.x} y=${p.y}`)
        );
        if (routedPoints.length > 0) {
            this.addHandle(edge, 'source', 'routing-point', -2);
            for (let i = 0; i < routedPoints.length - 1; i++) {
                this.addHandle(edge, 'manhattan-50%', 'volatile-routing-point', i - 1);
            }
            this.addHandle(edge, 'target', 'routing-point', routedPoints.length - 2);
        }
    }

    /**
     * Returns the position of an inner routing handle (midpoint of segment).
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
     * Applies movements of inner routing handles to edge.routingPoints.
     * Keeps all segments orthogonal (Manhattan style).
     */
    override applyInnerHandleMoves(
        edge: GRoutableElement,
        moves: ResolvedHandleMove[]
    ): void {
        const route = this.route(edge);
        const routingPoints = edge.routingPoints;

        moves.forEach(move => {
            const handle = move.handle;
            const index = handle.pointIndex;
            this.debug(`applyInnerHandleMoves kind=${handle.kind} index=${index} to=${move.toPosition.x},${move.toPosition.y}`);

            if (handle.kind === 'manhattan-50%') {
                if (index < 0) {
                    if (routingPoints.length === 0) {
                        routingPoints.push({ x: move.toPosition.x, y: move.toPosition.y });
                        handle.pointIndex = 0;
                    } else if (this.isVerticalSegment(route[0], route[1])) {
                        this.alignX(routingPoints, 0, move.toPosition.x);
                    } else {
                        this.alignY(routingPoints, 0, move.toPosition.y);
                    }
                } else if (index < routingPoints.length - 1) {
                    if (this.isVerticalSegment(routingPoints[index], routingPoints[index + 1])) {
                        this.alignX(routingPoints, index, move.toPosition.x);
                        this.alignX(routingPoints, index + 1, move.toPosition.x);
                    } else {
                        this.alignY(routingPoints, index, move.toPosition.y);
                        this.alignY(routingPoints, index + 1, move.toPosition.y);
                    }
                } else {
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