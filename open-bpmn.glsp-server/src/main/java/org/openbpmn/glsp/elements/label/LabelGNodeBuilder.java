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
package org.openbpmn.glsp.elements.label;

import org.eclipse.glsp.graph.GCompartment;
import org.eclipse.glsp.graph.builder.AbstractGNodeBuilder;
import org.eclipse.glsp.graph.builder.impl.GLayoutOptions;
import org.eclipse.glsp.graph.util.GConstants;
import org.eclipse.glsp.graph.util.GraphUtil;
import org.openbpmn.bpmn.BPMNTypes;
import org.openbpmn.bpmn.elements.core.BPMNElementNode;
import org.openbpmn.bpmn.elements.core.BPMNLabel;
import org.openbpmn.bpmn.exceptions.BPMNMissingElementException;
import org.openbpmn.glsp.bpmn.BpmnFactory;
import org.openbpmn.glsp.bpmn.LabelGNode;
import org.openbpmn.glsp.utils.BPMNGModelUtil;

/**
 * BPMN 2.0 Label Element.
 * <p>
 * The method builds a GNode from a BPMNEvent or BPMNGateway element. The
 * builder is called from the method createGModelFromProcess of the
 * BPMNGModelFactory. The Caller must set the position after the GNode is
 * created.
 * <p>
 * Note: The LabelGNode generated by this builder has the default dimensions of
 * a BPMNLabel. A caller can change the dimension by calling the size() method
 * of the GNode
 *
 * @author rsoika
 *
 */
public class LabelGNodeBuilder extends AbstractGNodeBuilder<LabelGNode, LabelGNodeBuilder> {

    private final String name;
    private static final String V_GRAB = "vGrab";
    private static final String H_GRAB = "hGrab";

    public LabelGNodeBuilder(final BPMNElementNode flowElement) {
        super(BPMNTypes.BPMNLABEL);
        this.name = flowElement.getName();// _name;
        this.id = flowElement.getId() + "_bpmnlabel";
        double width = BPMNLabel.DEFAULT_WIDTH;
        double height = BPMNLabel.DEFAULT_HEIGHT;

        // compute size
        try {
            if (flowElement.getLabel() != null && flowElement.getLabel().getBounds() != null) {
                width = flowElement.getLabel().getBounds().getDimension().getWidth();
                height = flowElement.getLabel().getBounds().getDimension().getHeight();
                // adjust default size if no bounds are set....
                if (width == 0 || height == 0) {
                    width = BPMNLabel.DEFAULT_WIDTH;
                    height = BPMNLabel.DEFAULT_HEIGHT;
                    flowElement.getLabel().getBounds().setDimension(width, height);
                }
            }
        } catch (BPMNMissingElementException e) {
            // failed to compute size
            e.printStackTrace();
        }
        this.size = GraphUtil.dimension(width, height);

        // set Layout options
        this.addCssClass(type);
    }

    @Override
    protected LabelGNode instantiate() {
        return BpmnFactory.eINSTANCE.createLabelGNode();
    }

    @Override
    protected LabelGNodeBuilder self() {
        return this;
    }

    public String getName() {
        return name;
    }

    /**
     * The labelGNode element uses a HBOX layout with an embedded detail container
     * holding the multilabel.
     * This layout ensures that the element grows automatically with the size of the
     * multiLineNode.
     */
    @Override
    public void setProperties(final LabelGNode node) {
        super.setProperties(node);
        node.setName(name);
        node.setLayout(GConstants.Layout.HBOX);

        // Set absolute and min width/height for the Pool element
        node.getLayoutOptions().put(GLayoutOptions.KEY_MIN_WIDTH, BPMNLabel.DEFAULT_WIDTH);
        node.getLayoutOptions().put(GLayoutOptions.KEY_MIN_HEIGHT, BPMNLabel.DEFAULT_HEIGHT);
        if (size != null) {
            node.getLayoutOptions().put(GLayoutOptions.KEY_PREF_WIDTH, size.getWidth());
            node.getLayoutOptions().put(GLayoutOptions.KEY_PREF_HEIGHT, size.getHeight());
        }
        GCompartment detailsContainer = BPMNGModelUtil.createMultiLineContainer(node);
        node.getChildren().add(detailsContainer);

        // add a multiLine text block
        detailsContainer.getChildren()
                .add(BPMNGModelUtil.createMultiLineTextNode(node, name, BPMNGModelUtil.MULTILINETEXT_ALIGN_MIDDLE, 0));
    }


}
