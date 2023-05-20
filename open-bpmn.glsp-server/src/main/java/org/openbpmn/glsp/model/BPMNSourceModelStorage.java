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
package org.openbpmn.glsp.model;

import static org.eclipse.glsp.server.types.GLSPServerException.getOrThrow;

import java.io.File;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.eclipse.glsp.server.actions.ActionDispatcher;
import org.eclipse.glsp.server.actions.SaveModelAction;
import org.eclipse.glsp.server.actions.ServerMessageAction;
import org.eclipse.glsp.server.actions.SetDirtyStateAction;
import org.eclipse.glsp.server.features.core.model.RequestModelAction;
import org.eclipse.glsp.server.features.core.model.SourceModelStorage;
import org.eclipse.glsp.server.model.GModelState;
import org.eclipse.glsp.server.utils.ClientOptionsUtil;
import org.eclipse.glsp.server.utils.MapUtil;
import org.openbpmn.bpmn.BPMNModel;
import org.openbpmn.bpmn.exceptions.BPMNModelException;
import org.openbpmn.bpmn.util.BPMNModelFactory;
import org.openbpmn.glsp.BPMNDiagramConfiguration;
import org.openbpmn.glsp.utils.BPMNActionUtil;

import com.google.inject.Inject;

/**
 * The BPMNSourceModelStorage handles loading and the persistence of BPMN source
 * models.
 * <p>
 * The SourceModelStorage is called by the GLSP Server when the client requests
 * to open a new BPMN file.
 *
 * @author rsoika
 * @version 1.0
 */
public class BPMNSourceModelStorage implements SourceModelStorage {
    private static Logger logger = LogManager.getLogger(BPMNSourceModelStorage.class);

    @Inject
    protected BPMNGModelState modelState;

    @Inject
    protected ActionDispatcher actionDispatcher;

    /**
     * Loads a source model into the modelState.
     */
    @Override
    public void loadSourceModel(final RequestModelAction action) {
        logger.debug("loading BPMN Meta model....");
        Map<String, String> options = action.getOptions();
        boolean bNeedsClientLayout = Boolean.parseBoolean(options.get("needsClientLayout"));
        // resolve file location....
        // String uri = MapUtil.getValue(options, "sourceUri").orElse(null);
        // if (uri == null || uri.isEmpty()) {
        // // fallback
        // uri = options.get("uri");
        // }

        final File file = getSourceFile(modelState);

        logger.warn("loadSourceModel from : " + file);
        String diagramType = options.get("diagramType");
        if (bNeedsClientLayout && file != null && BPMNDiagramConfiguration.DIAGRAM_TYPE.equals(diagramType)) {
            BPMNModel model;
            try {
                model = BPMNModelFactory.read(file);
                // we store the BPMN meta model into the modelState
                modelState.setBpmnModel(model);
                // if the model is dirty (because linked-file content has change) we send a
                // DirtyState action...
                if (model.isDirty()) {
                    logger.info("....external model content has changed.");
                    SetDirtyStateAction dirtyAction = new SetDirtyStateAction(true, "Updated linked File Content");
                    actionDispatcher.dispatchAfterNextUpdate(dirtyAction);
                }
                // dispatch all model notifications...
                while (!model.getNotifications().isEmpty()) {
                    ServerMessageAction serverMessage = BPMNActionUtil
                            .convertModelNotification(model.getNotifications().remove(0));
                    actionDispatcher.dispatchAfterNextUpdate(serverMessage);
                }
            } catch (BPMNModelException e) {
                logger.error("Failed to load model source: " + e.getMessage());
            }
        }
    }

    /**
     * Saves a model. The SaveModelAction is sent from the client to the server in
     * order to persist the current model state back to the source model. A new
     * fileUri can be defined to save the model to a new destination different from
     * its original source model.
     */
    @Override
    public void saveSourceModel(final SaveModelAction action) {
        logger.debug("saveSourceModel....");
        // Map<String, String> options = modelState.getClientOptions();
        // // resolve origin file location....
        // String filePath = MapUtil.getValue(options, "sourceUri").orElse(null);
        // if (filePath == null || filePath.isEmpty()) {
        // // fallback
        // filePath = options.get("uri");
        // }

        // // test if we have a new fileUri....
        // String newFileURI = action.getFileUri().orElse(null);
        // if (newFileURI != null && !newFileURI.isEmpty()) {
        // // we got a new URI which means we have a 'saveAs' situation!
        // filePath = newFileURI;
        // }

        final File file = getTargetFile(modelState, action);
        logger.warn("saveSourceModel to : " + file);

        BPMNModel model = modelState.getBpmnModel();
        model.save(file);

        // process all model notifications...
        while (!model.getNotifications().isEmpty()) {
            ServerMessageAction serverMessage = BPMNActionUtil
                    .convertModelNotification(model.getNotifications().remove(0));
            actionDispatcher.dispatchAfterNextUpdate(serverMessage);
        }
    }

    /**
     * This helper method opens the corresponding java.io.File form the given
     * clientOptions
     *
     * @param modelState
     * @return
     */
    @Deprecated
    protected File convertToFile(final GModelState modelState) {
        return getOrThrow(ClientOptionsUtil.getSourceUriAsFile(modelState.getClientOptions()),
                "Invalid file URI:" + ClientOptionsUtil.getSourceUri(modelState.getClientOptions()));
    }

    private static final String FILE_PREFIX = "file://";

    /**
     * Resolves to a source File instance from a GModelState to load a model. Can be
     * called from the method <code>SourceModelStorage.loadSourceModel</code>.
     * 
     * @param modelState
     * @return a File Instance - or null
     * @throws NullPointerException
     *                              If the sourceUri resolves to <code>null</code>
     */
    public static File getSourceFile(final GModelState modelState) {
        String filePath = MapUtil.getValue(modelState.getClientOptions(), "sourceUri").orElse(null);
        // strip the file:// prefix
        filePath = filePath.replace(FILE_PREFIX, "");
        logger.warn("source uri=" + filePath);
        return new File(filePath);
    }

    /**
     * Resolves to a target File instance from a SaveModelAction and the GModelState
     * to save a model. Can be called from the method
     * <code>SourceModelStorage.loadSourceModel</code>.
     * 
     * @param modelState
     * @return a File Instance - or null
     * @throws NullPointerException
     *                              If the sourceUri resolves to <code>null</code>
     */
    public static File getTargetFile(final GModelState modelState, final SaveModelAction action) {
        // first take the origin sourceUri from the current modelState
        String filePath = MapUtil.getValue(modelState.getClientOptions(), "sourceUri").orElse(null);
        // test if we have a new optional fileUri....
        String newFileURI = action.getFileUri().orElse(null);
        if (newFileURI != null && !newFileURI.isEmpty()) {
            // we got a new URI which means we have a 'saveAs' situation!
            filePath = newFileURI;
        }
        logger.warn("target uri=" + filePath);
        // strip the optional file:// prefix
        filePath = filePath.replace(FILE_PREFIX, "");
        return new File(filePath);
    }

}
