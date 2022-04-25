/**
 */
package org.eclipse.bpmn2.impl;

import java.util.Collection;

import org.eclipse.bpmn2.Artifact;
import org.eclipse.bpmn2.Bpmn2Package;
import org.eclipse.bpmn2.ConversationLink;
import org.eclipse.bpmn2.FlowElement;
import org.eclipse.bpmn2.FlowElementsContainer;
import org.eclipse.bpmn2.InteractionNode;
import org.eclipse.bpmn2.LaneSet;
import org.eclipse.bpmn2.SubProcess;

import org.eclipse.emf.common.notify.Notification;
import org.eclipse.emf.common.notify.NotificationChain;

import org.eclipse.emf.common.util.EList;

import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.InternalEObject;

import org.eclipse.emf.ecore.impl.ENotificationImpl;

import org.eclipse.emf.ecore.util.EObjectContainmentEList;
import org.eclipse.emf.ecore.util.InternalEList;

/**
 * <!-- begin-user-doc -->
 * An implementation of the model object '<em><b>Sub Process</b></em>'.
 * <!-- end-user-doc -->
 * <p>
 * The following features are implemented:
 * </p>
 * <ul>
 *   <li>{@link org.eclipse.bpmn2.impl.SubProcessImpl#getLaneSets <em>Lane Sets</em>}</li>
 *   <li>{@link org.eclipse.bpmn2.impl.SubProcessImpl#getFlowElements <em>Flow Elements</em>}</li>
 *   <li>{@link org.eclipse.bpmn2.impl.SubProcessImpl#getIncomingConversationLinks <em>Incoming Conversation Links</em>}</li>
 *   <li>{@link org.eclipse.bpmn2.impl.SubProcessImpl#getOutgoingConversationLinks <em>Outgoing Conversation Links</em>}</li>
 *   <li>{@link org.eclipse.bpmn2.impl.SubProcessImpl#getArtifacts <em>Artifacts</em>}</li>
 *   <li>{@link org.eclipse.bpmn2.impl.SubProcessImpl#isTriggeredByEvent <em>Triggered By Event</em>}</li>
 * </ul>
 *
 * @generated
 */
public class SubProcessImpl extends ActivityImpl implements SubProcess {
    /**
     * The cached value of the '{@link #getLaneSets() <em>Lane Sets</em>}' containment reference list.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getLaneSets()
     * @generated
     * @ordered
     */
    protected EList<LaneSet> laneSets;

    /**
     * The cached value of the '{@link #getFlowElements() <em>Flow Elements</em>}' containment reference list.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getFlowElements()
     * @generated
     * @ordered
     */
    protected EList<FlowElement> flowElements;

    /**
     * The cached value of the '{@link #getArtifacts() <em>Artifacts</em>}' containment reference list.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #getArtifacts()
     * @generated
     * @ordered
     */
    protected EList<Artifact> artifacts;

    /**
     * The default value of the '{@link #isTriggeredByEvent() <em>Triggered By Event</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #isTriggeredByEvent()
     * @generated
     * @ordered
     */
    protected static final boolean TRIGGERED_BY_EVENT_EDEFAULT = false;

    /**
     * The cached value of the '{@link #isTriggeredByEvent() <em>Triggered By Event</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @see #isTriggeredByEvent()
     * @generated
     * @ordered
     */
    protected boolean triggeredByEvent = TRIGGERED_BY_EVENT_EDEFAULT;

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    protected SubProcessImpl() {
        super();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    protected EClass eStaticClass() {
        return Bpmn2Package.Literals.SUB_PROCESS;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public EList<LaneSet> getLaneSets() {
        if (laneSets == null) {
            laneSets = new EObjectContainmentEList<LaneSet>(LaneSet.class, this, Bpmn2Package.SUB_PROCESS__LANE_SETS);
        }
        return laneSets;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public EList<FlowElement> getFlowElements() {
        if (flowElements == null) {
            flowElements = new EObjectContainmentEList<FlowElement>(FlowElement.class, this, Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS);
        }
        return flowElements;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public EList<ConversationLink> getIncomingConversationLinks() {
        // TODO: implement this method to return the 'Incoming Conversation Links' reference list
        // Ensure that you remove @generated or mark it @generated NOT
        // The list is expected to implement org.eclipse.emf.ecore.util.InternalEList and org.eclipse.emf.ecore.EStructuralFeature.Setting
        // so it's likely that an appropriate subclass of org.eclipse.emf.ecore.util.EcoreEList should be used.
        throw new UnsupportedOperationException();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public EList<ConversationLink> getOutgoingConversationLinks() {
        // TODO: implement this method to return the 'Outgoing Conversation Links' reference list
        // Ensure that you remove @generated or mark it @generated NOT
        // The list is expected to implement org.eclipse.emf.ecore.util.InternalEList and org.eclipse.emf.ecore.EStructuralFeature.Setting
        // so it's likely that an appropriate subclass of org.eclipse.emf.ecore.util.EcoreEList should be used.
        throw new UnsupportedOperationException();
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public EList<Artifact> getArtifacts() {
        if (artifacts == null) {
            artifacts = new EObjectContainmentEList<Artifact>(Artifact.class, this, Bpmn2Package.SUB_PROCESS__ARTIFACTS);
        }
        return artifacts;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public boolean isTriggeredByEvent() {
        return triggeredByEvent;
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    public void setTriggeredByEvent(boolean newTriggeredByEvent) {
        boolean oldTriggeredByEvent = triggeredByEvent;
        triggeredByEvent = newTriggeredByEvent;
        if (eNotificationRequired())
            eNotify(new ENotificationImpl(this, Notification.SET, Bpmn2Package.SUB_PROCESS__TRIGGERED_BY_EVENT, oldTriggeredByEvent, triggeredByEvent));
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public NotificationChain eInverseRemove(InternalEObject otherEnd, int featureID, NotificationChain msgs) {
        switch (featureID) {
            case Bpmn2Package.SUB_PROCESS__LANE_SETS:
                return ((InternalEList<?>)getLaneSets()).basicRemove(otherEnd, msgs);
            case Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS:
                return ((InternalEList<?>)getFlowElements()).basicRemove(otherEnd, msgs);
            case Bpmn2Package.SUB_PROCESS__ARTIFACTS:
                return ((InternalEList<?>)getArtifacts()).basicRemove(otherEnd, msgs);
        }
        return super.eInverseRemove(otherEnd, featureID, msgs);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public Object eGet(int featureID, boolean resolve, boolean coreType) {
        switch (featureID) {
            case Bpmn2Package.SUB_PROCESS__LANE_SETS:
                return getLaneSets();
            case Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS:
                return getFlowElements();
            case Bpmn2Package.SUB_PROCESS__INCOMING_CONVERSATION_LINKS:
                return getIncomingConversationLinks();
            case Bpmn2Package.SUB_PROCESS__OUTGOING_CONVERSATION_LINKS:
                return getOutgoingConversationLinks();
            case Bpmn2Package.SUB_PROCESS__ARTIFACTS:
                return getArtifacts();
            case Bpmn2Package.SUB_PROCESS__TRIGGERED_BY_EVENT:
                return isTriggeredByEvent();
        }
        return super.eGet(featureID, resolve, coreType);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @SuppressWarnings("unchecked")
    @Override
    public void eSet(int featureID, Object newValue) {
        switch (featureID) {
            case Bpmn2Package.SUB_PROCESS__LANE_SETS:
                getLaneSets().clear();
                getLaneSets().addAll((Collection<? extends LaneSet>)newValue);
                return;
            case Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS:
                getFlowElements().clear();
                getFlowElements().addAll((Collection<? extends FlowElement>)newValue);
                return;
            case Bpmn2Package.SUB_PROCESS__ARTIFACTS:
                getArtifacts().clear();
                getArtifacts().addAll((Collection<? extends Artifact>)newValue);
                return;
            case Bpmn2Package.SUB_PROCESS__TRIGGERED_BY_EVENT:
                setTriggeredByEvent((Boolean)newValue);
                return;
        }
        super.eSet(featureID, newValue);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public void eUnset(int featureID) {
        switch (featureID) {
            case Bpmn2Package.SUB_PROCESS__LANE_SETS:
                getLaneSets().clear();
                return;
            case Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS:
                getFlowElements().clear();
                return;
            case Bpmn2Package.SUB_PROCESS__ARTIFACTS:
                getArtifacts().clear();
                return;
            case Bpmn2Package.SUB_PROCESS__TRIGGERED_BY_EVENT:
                setTriggeredByEvent(TRIGGERED_BY_EVENT_EDEFAULT);
                return;
        }
        super.eUnset(featureID);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public boolean eIsSet(int featureID) {
        switch (featureID) {
            case Bpmn2Package.SUB_PROCESS__LANE_SETS:
                return laneSets != null && !laneSets.isEmpty();
            case Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS:
                return flowElements != null && !flowElements.isEmpty();
            case Bpmn2Package.SUB_PROCESS__INCOMING_CONVERSATION_LINKS:
                return !getIncomingConversationLinks().isEmpty();
            case Bpmn2Package.SUB_PROCESS__OUTGOING_CONVERSATION_LINKS:
                return !getOutgoingConversationLinks().isEmpty();
            case Bpmn2Package.SUB_PROCESS__ARTIFACTS:
                return artifacts != null && !artifacts.isEmpty();
            case Bpmn2Package.SUB_PROCESS__TRIGGERED_BY_EVENT:
                return triggeredByEvent != TRIGGERED_BY_EVENT_EDEFAULT;
        }
        return super.eIsSet(featureID);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public int eBaseStructuralFeatureID(int derivedFeatureID, Class<?> baseClass) {
        if (baseClass == FlowElementsContainer.class) {
            switch (derivedFeatureID) {
                case Bpmn2Package.SUB_PROCESS__LANE_SETS: return Bpmn2Package.FLOW_ELEMENTS_CONTAINER__LANE_SETS;
                case Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS: return Bpmn2Package.FLOW_ELEMENTS_CONTAINER__FLOW_ELEMENTS;
                default: return -1;
            }
        }
        if (baseClass == InteractionNode.class) {
            switch (derivedFeatureID) {
                case Bpmn2Package.SUB_PROCESS__INCOMING_CONVERSATION_LINKS: return Bpmn2Package.INTERACTION_NODE__INCOMING_CONVERSATION_LINKS;
                case Bpmn2Package.SUB_PROCESS__OUTGOING_CONVERSATION_LINKS: return Bpmn2Package.INTERACTION_NODE__OUTGOING_CONVERSATION_LINKS;
                default: return -1;
            }
        }
        return super.eBaseStructuralFeatureID(derivedFeatureID, baseClass);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public int eDerivedStructuralFeatureID(int baseFeatureID, Class<?> baseClass) {
        if (baseClass == FlowElementsContainer.class) {
            switch (baseFeatureID) {
                case Bpmn2Package.FLOW_ELEMENTS_CONTAINER__LANE_SETS: return Bpmn2Package.SUB_PROCESS__LANE_SETS;
                case Bpmn2Package.FLOW_ELEMENTS_CONTAINER__FLOW_ELEMENTS: return Bpmn2Package.SUB_PROCESS__FLOW_ELEMENTS;
                default: return -1;
            }
        }
        if (baseClass == InteractionNode.class) {
            switch (baseFeatureID) {
                case Bpmn2Package.INTERACTION_NODE__INCOMING_CONVERSATION_LINKS: return Bpmn2Package.SUB_PROCESS__INCOMING_CONVERSATION_LINKS;
                case Bpmn2Package.INTERACTION_NODE__OUTGOING_CONVERSATION_LINKS: return Bpmn2Package.SUB_PROCESS__OUTGOING_CONVERSATION_LINKS;
                default: return -1;
            }
        }
        return super.eDerivedStructuralFeatureID(baseFeatureID, baseClass);
    }

    /**
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @generated
     */
    @Override
    public String toString() {
        if (eIsProxy()) return super.toString();

        StringBuilder result = new StringBuilder(super.toString());
        result.append(" (triggeredByEvent: ");
        result.append(triggeredByEvent);
        result.append(')');
        return result.toString();
    }

} //SubProcessImpl
