/**
 */
package org.eclipse.bpmn2;

import org.eclipse.emf.common.util.EList;

/**
 * <!-- begin-user-doc -->
 * A representation of the model object '<em><b>Partner Entity</b></em>'.
 * <!-- end-user-doc -->
 *
 * <p>
 * The following features are supported:
 * </p>
 * <ul>
 *   <li>{@link org.eclipse.bpmn2.PartnerEntity#getParticipantRef <em>Participant Ref</em>}</li>
 *   <li>{@link org.eclipse.bpmn2.PartnerEntity#getName <em>Name</em>}</li>
 * </ul>
 *
 * @see org.eclipse.bpmn2.Bpmn2Package#getPartnerEntity()
 * @model extendedMetaData="name='tPartnerEntity' kind='elementOnly'"
 * @generated
 */
public interface PartnerEntity extends RootElement {
    /**
     * Returns the value of the '<em><b>Participant Ref</b></em>' reference list.
     * The list contents are of type {@link org.eclipse.bpmn2.Participant}.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @return the value of the '<em>Participant Ref</em>' reference list.
     * @see org.eclipse.bpmn2.Bpmn2Package#getPartnerEntity_ParticipantRef()
     * @model ordered="false"
     *        extendedMetaData="kind='element' name='participantRef' namespace='http://www.omg.org/spec/BPMN/20100524/MODEL'"
     * @generated
     */
    EList<Participant> getParticipantRef();

    /**
     * Returns the value of the '<em><b>Name</b></em>' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @return the value of the '<em>Name</em>' attribute.
     * @see #setName(String)
     * @see org.eclipse.bpmn2.Bpmn2Package#getPartnerEntity_Name()
     * @model ordered="false"
     *        extendedMetaData="kind='attribute' name='name'"
     * @generated
     */
    String getName();

    /**
     * Sets the value of the '{@link org.eclipse.bpmn2.PartnerEntity#getName <em>Name</em>}' attribute.
     * <!-- begin-user-doc -->
     * <!-- end-user-doc -->
     * @param value the new value of the '<em>Name</em>' attribute.
     * @see #getName()
     * @generated
     */
    void setName(String value);

} // PartnerEntity
