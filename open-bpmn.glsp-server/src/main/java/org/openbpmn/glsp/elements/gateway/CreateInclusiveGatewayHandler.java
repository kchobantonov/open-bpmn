/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
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
package org.openbpmn.glsp.elements.gateway;

import org.openbpmn.bpmn.BPMNGatewayType;

public class CreateInclusiveGatewayHandler extends AbstractCreateGatewayHandler {

    public CreateInclusiveGatewayHandler() {
        super(BPMNGatewayType.INCLUSIVE.name, i -> "InclusiveGateway" + i);
    }

    @Override
    public String getLabel() {
        return "Inclusive Gateway";
    }

//   @Override
//   protected GatewayNodeBuilder builder(final Optional<GPoint> point, final GModelState modelState) {
//      return super.builder(point, modelState)
//         .addCssClass("incusive");
//   }
}