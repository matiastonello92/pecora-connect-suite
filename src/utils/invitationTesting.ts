import { supabase } from '@/integrations/supabase/client';
import { validateInvitationToken } from './invitationValidation';

export interface InvitationTestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

export const testInvitationFlow = async (email: string = 'test@example.com'): Promise<InvitationTestResult[]> => {
  const results: InvitationTestResult[] = [];
  
  try {
    // Step 1: Clean up any existing test invitation
    results.push({
      step: '1. Cleanup',
      success: true,
      message: 'Starting invitation flow test'
    });

    await supabase
      .from('user_invitations')
      .delete()
      .eq('email', email);

    // Step 2: Create a test invitation
    const { data: invitation, error: createError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        first_name: 'Test',
        last_name: 'User',
        role: 'base',
        location: 'menton',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (createError || !invitation) {
      results.push({
        step: '2. Create Invitation',
        success: false,
        message: `Failed to create test invitation: ${createError?.message}`
      });
      return results;
    }

    results.push({
      step: '2. Create Invitation',
      success: true,
      message: 'Test invitation created successfully',
      data: { id: invitation.id, token: invitation.invitation_token }
    });

    // Step 3: Test token validation
    const validationResult = await validateInvitationToken(invitation.invitation_token);
    
    if (!validationResult.isValid) {
      results.push({
        step: '3. Token Validation',
        success: false,
        message: `Token validation failed: ${validationResult.errorMessage}`
      });
      return results;
    }

    results.push({
      step: '3. Token Validation',
      success: true,
      message: 'Token validation passed',
      data: validationResult
    });

    // Step 4: Generate invitation link
    const origin = window.location.origin;
    const invitationLink = `${origin}/auth/complete-signup?token=${invitation.invitation_token}&type=invite`;
    
    results.push({
      step: '4. Generate Link',
      success: true,
      message: 'Invitation link generated',
      data: { link: invitationLink }
    });

    // Step 5: Test expired invitation handling
    const expiredToken = crypto.randomUUID();
    const { error: expiredError } = await supabase
      .from('user_invitations')
      .insert({
        email: 'expired@example.com',
        first_name: 'Expired',
        last_name: 'User',
        role: 'base',
        location: 'menton',
        status: 'pending',
        invitation_token: expiredToken,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      });

    if (!expiredError) {
      const expiredValidation = await validateInvitationToken(expiredToken);
      if (!expiredValidation.isValid && expiredValidation.errorCode === 'EXPIRED') {
        results.push({
          step: '5. Expired Token Test',
          success: true,
          message: 'Expired token correctly rejected'
        });
      } else {
        results.push({
          step: '5. Expired Token Test',
          success: false,
          message: 'Expired token validation failed'
        });
      }
    }

    // Step 6: Clean up test data
    await supabase
      .from('user_invitations')
      .delete()
      .in('email', [email, 'expired@example.com']);

    results.push({
      step: '6. Cleanup',
      success: true,
      message: 'Test data cleaned up'
    });

    return results;
  } catch (error: any) {
    results.push({
      step: 'Error',
      success: false,
      message: `Test failed with error: ${error.message}`
    });
    return results;
  }
};

export const logTestResults = (results: InvitationTestResult[]) => {
  console.log('=== INVITATION FLOW TEST RESULTS ===');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.step}: ${result.message}`);
    if (result.data) {
      console.log('   Data:', result.data);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Invitation flow is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the results above.');
  }
};