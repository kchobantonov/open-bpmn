/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
package org.imixs.bpmn.glsp.elements.event;

import org.eclipse.glsp.graph.builder.AbstractGNodeBuilder;
import org.eclipse.glsp.graph.util.GConstants;
import org.imixs.bpmn.glsp.utils.BPMNBuilderHelper;
import org.imixs.bpmn2.Bpmn2Factory;
import org.imixs.bpmn2.ThrowEvent;

/**
 * The CatchEventNodeBuilder defines the layout of BPMN events
 *
 * @author rsoika
 *
 */
public class ThrowEventNodeBuilder extends AbstractGNodeBuilder<ThrowEvent, ThrowEventNodeBuilder> {

    // <T extends GNode, E extends AbstractGNodeBuilder<T, E>>

    private final String name;
    private final String eventType;

    public ThrowEventNodeBuilder(final String type, final String name, String eventType) {
        super(type);
        this.name = name;
        if (eventType == null || eventType.isEmpty()) {
            eventType = "";
        }
        this.eventType = eventType;

    }

    @Override
    protected ThrowEvent instantiate() {
        return Bpmn2Factory.eINSTANCE.createThrowEvent();
    }

    @Override
    protected ThrowEventNodeBuilder self() {
        return this;
    }

    @Override
    public void setProperties(final ThrowEvent node) {
        super.setProperties(node);
        node.setName(name);
        node.getCategory().add(eventType);
        node.setLayout(GConstants.Layout.FREEFORM);

        node.getChildren().add(BPMNBuilderHelper.createCompartmentHeader(node));
        node.getChildren().add(BPMNBuilderHelper.createBPMNPort(node, -20.0, -20.0, 40.0, 40.0));
    }

}
